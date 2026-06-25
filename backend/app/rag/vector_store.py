from pathlib import Path

from langchain_chroma import Chroma
from langchain_community.document_loaders import DirectoryLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.rag.embeddings import get_embeddings

CHROMA_DIR = Path(__file__).parents[2] / "chroma_db"
KB_DIR = Path(__file__).parents[3] / "knowledge_base"
COLLECTION = "health_knowledge"

_store: Chroma | None = None


def init_vector_store() -> None:
    global _store
    _store = _load_or_build()
    print(f"[RAG] Vector store ready — collection={COLLECTION}, dir={CHROMA_DIR}")


def get_vector_store() -> Chroma:
    global _store
    if _store is None:
        init_vector_store()
    return _store


def _load_or_build() -> Chroma:
    embeddings = get_embeddings()
    if CHROMA_DIR.exists() and any(CHROMA_DIR.iterdir()):
        print("[RAG] Loading existing ChromaDB from disk...")
        return Chroma(
            persist_directory=str(CHROMA_DIR),
            collection_name=COLLECTION,
            embedding_function=embeddings,
        )
    return _build(embeddings)


def _build(embeddings) -> Chroma:
    print(f"[RAG] Building ChromaDB from knowledge base at {KB_DIR}...")
    loader = DirectoryLoader(
        str(KB_DIR),
        glob="**/*.md",
        loader_cls=TextLoader,
        loader_kwargs={"encoding": "utf-8"},
        show_progress=True,
    )
    docs = loader.load()
    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=100)
    chunks = splitter.split_documents(docs)
    print(f"[RAG] Embedded {len(chunks)} chunks from {len(docs)} documents")
    CHROMA_DIR.mkdir(parents=True, exist_ok=True)
    return Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=COLLECTION,
        persist_directory=str(CHROMA_DIR),
    )
