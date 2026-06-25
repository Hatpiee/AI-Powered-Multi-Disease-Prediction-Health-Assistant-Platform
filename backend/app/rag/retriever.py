from langchain_core.vectorstores import VectorStoreRetriever

from app.rag.vector_store import get_vector_store


def get_retriever() -> VectorStoreRetriever:
    return get_vector_store().as_retriever(
        search_type="similarity",
        search_kwargs={"k": 5},
    )
