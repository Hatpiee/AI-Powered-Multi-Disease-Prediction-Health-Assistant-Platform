from typing import List

from langchain_core.documents import Document
from langchain_core.language_models import BaseChatModel
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

from app.core.config import settings
from app.rag.retriever import get_retriever

_chain = None

_CONTEXTUALIZE_PROMPT = ChatPromptTemplate.from_messages([
    ("system",
     "Given a chat history and the latest user question which may reference prior context, "
     "formulate a standalone question that can be understood without the chat history. "
     "Do NOT answer the question — just reformulate it if needed, otherwise return it as is."),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])

_QA_SYSTEM = """You are a knowledgeable and compassionate AI health assistant specializing in \
diabetes, heart disease, liver disease, and kidney disease. Use the retrieved medical knowledge \
below to answer the user's question accurately and helpfully.

Guidelines:
- Be clear, empathetic, and evidence-based in every response.
- Always recommend consulting a qualified healthcare professional for personal medical advice, \
diagnosis, or treatment decisions.
- Provide practical, actionable health information when appropriate.
- If the question is outside the scope of these four diseases, honestly acknowledge your focus area \
while still being helpful with general health context.
- Never provide specific diagnoses for individual patients.
- Never advise stopping or changing prescribed medications without physician guidance.
- If someone describes a medical emergency, direct them to call emergency services immediately.

Retrieved medical knowledge:
{context}"""

_QA_PROMPT = ChatPromptTemplate.from_messages([
    ("system", _QA_SYSTEM),
    MessagesPlaceholder("chat_history"),
    ("human", "{input}"),
])


def _format_docs(docs: List[Document]) -> str:
    return "\n\n".join(d.page_content for d in docs)


def _build_llm() -> BaseChatModel:
    if settings.GROQ_API_KEY:
        from langchain_groq import ChatGroq
        print("[RAG] Using Groq (llama-3.3-70b-versatile) as LLM")
        return ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=settings.GROQ_API_KEY,
            temperature=0.3,
        )
    if settings.GEMINI_API_KEY:
        from langchain_google_genai import ChatGoogleGenerativeAI
        print("[RAG] Using Gemini (gemini-2.0-flash) as LLM")
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.3,
        )
    raise RuntimeError(
        "No LLM API key configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env"
    )


def get_chain():
    global _chain
    if _chain is None:
        _chain = _build()
    return _chain


def _build():
    llm = _build_llm()
    retriever = get_retriever()
    str_out = StrOutputParser()
    reformulate = _CONTEXTUALIZE_PROMPT | llm | str_out

    def get_retrieval_query(x: dict) -> str:
        if x.get("chat_history"):
            return reformulate.invoke(x)
        return x["input"]

    return (
        RunnablePassthrough.assign(
            retrieval_query=RunnableLambda(get_retrieval_query)
        )
        | RunnablePassthrough.assign(
            context=RunnableLambda(
                lambda x: _format_docs(retriever.invoke(x["retrieval_query"]))
            )
        )
        | {
            "answer": _QA_PROMPT | llm | str_out,
            "input": lambda x: x["input"],
        }
    )
