from typing import Tuple, List, Dict, Any, Union

import hashlib
from app.chroma_client import collection
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter


def chunk_to_id(chunk_text: str) -> str:
    """
    Generates a SHA256-based unique ID for a chunk of text.

    This ensures that the same chunk content consistently generates the same ID,
    useful for identifying and managing identical chunks.

    Args:
        chunk_text (str): The text content of the chunk.

    Returns:
        str: A hexadecimal SHA256 hash of the chunk text.
    """
    h = hashlib.sha256()
    h.update(chunk_text.encode("utf-8"))
    return h.hexdigest()


def process_pdf_to_chunks(
    user_id: str,
    chat_id: str,
    file_id: str,
    path_to_pdf: str,
    filename: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> Tuple[
    bool, Union[Dict[str, Any], Tuple[List[str], List[str], List[Dict[str, str]]]]
]:
    """
    Loads a PDF, chunks its content, and prepares the data for vector storage.

    The function handles loading the PDF, splitting it into manageable chunks
    using LangChain's RecursiveCharacterTextSplitter, and generating unique
    vector IDs and metadata for each chunk.

    Args:
        user_id (str): Identifier for the user.
        chat_id (str): Identifier for the specific chat session.
        file_id (str): Identifier for the PDF file being processed.
        path_to_pdf (str): The file path to the PDF document.
        chunk_size (int, optional): The maximum size (in characters) of each chunk. Defaults to 1000.
        chunk_overlap (int, optional): The number of characters to overlap between chunks. Defaults to 200.

    Returns:
        Tuple[bool, Union[Dict[str, Any], Tuple[List[str], List[str], List[Dict[str, str]]]]]:
            A tuple containing:
                - bool: True if successful, False otherwise.
                - Union[Dict[str, Any], Tuple[List[str], List[str], List[Dict[str, str]]]]:
                    - If successful: A tuple `(ids, docs, mdatas)` where `ids` are unique vector IDs,
                      `docs` are the chunk texts, and `mdatas` are the chunk metadata dictionaries.
                    - If unsuccessful: A dictionary containing error details (error_type, message).
    """

    try:
        # load PDF pages as LangChain Document objects
        loader = PyPDFLoader(path_to_pdf)
        pages = loader.load()

        # chunk text from pages
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size, chunk_overlap=chunk_overlap
        )
        chunks = text_splitter.split_documents(pages)

        ids = []
        docs = []
        mdatas = []

        for c in chunks:
            # Generate a unique ID based on the chunk content
            chunk_id = chunk_to_id(c.page_content)
            # Create a vector store specific ID combining identifiers
            vector_chunk_id = f"{user_id}_{chat_id}_{chunk_id}"
            metadata = {
                "user_Id": user_id,
                "chat_Id": chat_id,
                "chunk_id": chunk_id,
                "file_id": file_id,
                "source": filename,
                "page": c.metadata.get("page"),
            }
            ids.append(vector_chunk_id)
            docs.append(c.page_content)
            mdatas.append(metadata)

        return True, (ids, docs, mdatas)

    except Exception as e:
        return False, {
            "error_type": type(e).__name__,
            "message": f"Failed to process PDF and generate chunks: {str(e)}",
        }


def insert_chunks_to_vectorstore(
    ids: List[str], docs: List[str], metadatas: List[Dict[str, Any]]
) -> Tuple[bool, Union[None, Dict[str, Any]]]:
    """
    Inserts (upserts) processed document chunks into the ChromaDB vector store.

    Args:
        ids (List[str]): List of unique vector IDs for the chunks.
        docs (List[str]): List of the text content of the chunks.
        metadatas (List[Dict[str, Any]]): List of metadata dictionaries for the chunks.

    Returns:
        Tuple[bool, Union[None, Dict[str, Any]]]:
            A tuple indicating success (True, None) or failure (False, error dictionary).
    """
    try:
        # Using upsert ensures that if the ID already exists, it is updated; otherwise, it is inserted.
        collection.upsert(ids=ids, documents=docs, metadatas=metadatas)
        return True, None
    except Exception as e:
        return False, {
            "error_type": type(e).__name__,
            "message": f"Failed to insert chunks into vector store: {str(e)}",
        }


def query_chunks(
    user_id: str, chat_id: str, file_id: str, k: int, query: List[str]
) -> Tuple[bool, Union[List[Dict[str, Any]], Dict[str, Any]]]:
    """
    Queries the vector store for relevant chunks based on a given query, scoped by user, chat, and file ID.
    Transforms the raw ChromaDB results into a list of structured dictionaries,
    each containing document content, metadata, and distance.

    Args:
        user_id (str): Identifier for the user.
        chat_id (str): Identifier for the specific chat session.
        file_id (str): Identifier for the file to search within.
        k (int) : Top k-results.
        query (str): The natural language query string.

    Returns:
        Tuple[bool, Union[List[Dict[str, Any]], Dict[str, Any]]]:
            A tuple containing:
                - bool: True if successful, False otherwise.
                - Union[List[Dict[str, Any]], Dict[str, Any]]:
                    - If successful: A list of dictionaries, where each dictionary represents
                      a relevant chunk with 'document', 'metadata', and 'distance' keys.
                    - If unsuccessful: A dictionary containing error details (error_type, message).
    """
    try:
        # The final number of unique results to return after processing
        final_top_k = k

        results = collection.query(
            query_texts=query,
            n_results=3,  # You can make this configurable if needed
            where={
                "$and": [
                    {"user_Id": {"$eq": user_id}},
                    {"chat_Id": {"$eq": chat_id}},
                    {"file_id": {"$eq": file_id}},
                ]
            },
        )

        all_unique_results = []
        seen_ids = set()

        # ChromaDB returns lists of lists when query_texts is a list
        # We need to iterate through each query's results
        if (
            results and results.get("ids") and results["ids"]
        ):  # Check if results exist and ids list is not empty
            for i in range(len(results["ids"])):  # Iterate over each query's results
                current_query_ids = results["ids"][i]
                current_query_docs = results["documents"][i]
                current_query_metadatas = results["metadatas"][i]
                current_query_distances = results["distances"][i]

                for doc_id, doc, meta, dist in zip(
                    current_query_ids,
                    current_query_docs,
                    current_query_metadatas,
                    current_query_distances,
                ):
                    if doc_id not in seen_ids:
                        seen_ids.add(doc_id)
                        all_unique_results.append(
                            {
                                "id": doc_id,  # Included ID for potential future use or debugging
                                "distance": dist,
                                "document": doc.replace("\n", ""),
                                "page": meta["page"],
                                "source": meta["source"],
                            }
                        )

        # Sort all unique results by distance (ascending, as lower is better)
        all_unique_results.sort(key=lambda x: x["distance"])

        # Return the top k unique results
        return True, all_unique_results[:final_top_k]

    except Exception as e:
        return False, {
            "error_type": type(e).__name__,
            "message": f"Failed to query vector store: {str(e)}",
        }


def delete_chunks(
    user_id: str, chat_id: str, file_id: str
) -> Tuple[bool, Union[None, Dict[str, Any]]]:
    """
    Deletes all chunks associated with a specific file within a user's chat context from the vector store.

    Args:
        user_id (str): Identifier for the user.
        chat_id (str): Identifier for the specific chat session.
        file_id (str): Identifier for the file whose chunks should be deleted.

    Returns:
        Tuple[bool, Union[None, Dict[str, Any]]]:
            A tuple indicating success (True, None) or failure (False, error dictionary).
    """
    try:
        collection.delete(
            where=(
                {
                    "$and": [
                        {"file_id": {"$eq": file_id}},
                        {"user_Id": {"$eq": user_id}},
                        {"chat_Id": {"$eq": chat_id}},
                    ]
                }
            )
        )
        return True, None
    except Exception as e:
        return False, {
            "error_type": type(e).__name__,
            "message": f"Failed to delete chunks from vector store: {str(e)}",
        }


def count_chunks(
    user_id: str, chat_id: str, file_id: str
) -> Tuple[bool, Union[int, Dict[str, Any]]]:
    """
    Counts the number of chunks associated with a specific file within a user's chat context in the vector store.

    Args:
        user_id (str): Identifier for the user.
        chat_id (str): Identifier for the specific chat session.
        file_id (str): Identifier for the file to count chunks for.

    Returns:
        Tuple[bool, Union[int, Dict[str, Any]]]:
            A tuple indicating success and the count (True, count) or failure (False, error dictionary).
    """
    try:
        file_stats = collection.get(
            where=(
                {
                    "$and": [
                        {"file_id": {"$eq": file_id}},
                        {"user_Id": {"$eq": user_id}},
                        {"chat_Id": {"$eq": chat_id}},
                    ]
                }
            )
        )
        return True, len(file_stats["ids"])
    except Exception as e:
        return False, {
            "error_type": type(e).__name__,
            "message": f"Failed to retrieve chunk count: {str(e)}",
        }
