# vectorizer/server/main.py

import asyncio
import os

import grpc
# from concurrent import futures
import app.vectorizer.vectorizer_pb2 as pb2
import app.vectorizer.vectorizer_pb2_grpc as pb2_grpc

# Import your vectorization functions
from app.services.vector_ops import (
    process_pdf_to_chunks,
    insert_chunks_to_vectorstore,
    query_chunks,
    delete_chunks,
    count_chunks,
)

class VectorizerService(pb2_grpc.VectorizerServiceServicer):

    async def UploadAndVectorize(self, request_iterator, context):
        """
        Receives streamed PDF bytes, processes and vectorizes the document.
        """
        user_id = None
        chat_id = None
        file_id = None
        filename = None
        pdf_bytes = bytearray()
        temp_path = None

        async for chunk in request_iterator:
            if chunk.is_first_chunk:
                user_id = chunk.user_id
                chat_id = chunk.chat_id
                file_id = chunk.file_id
                filename = chunk.filename

            pdf_bytes.extend(chunk.data)

            if chunk.is_last_chunk:
                temp_dir = "./uploaded_pdfs"
                os.makedirs(temp_dir, exist_ok=True)
                temp_path = os.path.join(temp_dir, filename)

                try:
                    # Write PDF
                    with open(temp_path, "wb") as f:
                        f.write(pdf_bytes)

                    success, result = process_pdf_to_chunks(
                        user_id=user_id,
                        chat_id=chat_id,
                        file_id=file_id,
                        path_to_pdf=temp_path,
                        filename=filename,
                    )

                    if success:
                        ids, docs, mdatas = result
                        insert_chunks_to_vectorstore(ids, docs, mdatas)
                        return pb2.VectorizeResponse(
                            success=True,
                            message="Vectorization completed successfully.",
                            chunk_count=len(ids)
                        )
                    else:
                        return pb2.VectorizeResponse(
                            success=False,
                            message=result["message"],
                            chunk_count=0
                        )

                finally:
                    # Cleanup temp file
                    if temp_path and os.path.exists(temp_path):
                        try:
                            os.remove(temp_path)
                        except Exception as e:
                            # log error instead of crashing
                            print(f"Failed to delete temp file {temp_path}: {e}")

                    # Optionally clean up empty temp dir
                    if os.path.exists(temp_dir) and not os.listdir(temp_dir):
                        try:
                            os.rmdir(temp_dir)
                        except Exception as e:
                            print(f"Failed to delete temp dir {temp_dir}: {e}")

        return pb2.VectorizeResponse(
            success=False,
            message="No chunks received.",
            chunk_count=0
        )

    async def QueryVectors(self, request, context):
        success, result = query_chunks(
            request.user_id,
            request.chat_id,
            request.file_id,
            request.top_k,
            request.query_texts,
        )
        if success:
            results = []
            for r in result:
                results.append(pb2.QueryResult(
                    id=r["id"],
                    document=r["document"],
                    source=r["source"],
                    page=r["page"],
                    distance=r["distance"],
                ))
            return pb2.QueryResponse(
                success=True,
                message="Query completed.",
                results=results
            )
        else:
            return pb2.QueryResponse(
                success=False,
                message=result["message"],
                results=[]
            )

    async def CountVectors(self, request, context):
        success, result = count_chunks(
            request.user_id,
            request.chat_id,
            request.file_id
        )
        if success:
            return pb2.CountResponse(
                success=True,
                message="Count successful.",
                count=result
            )
        else:
            return pb2.CountResponse(
                success=False,
                message=result["message"],
                count=0
            )

    async def DeleteVectors(self, request, context):
        success, result = delete_chunks(
            request.user_id,
            request.chat_id,
            request.file_id
        )
        if success:
            return pb2.DeleteResponse(
                success=True,
                message="Delete successful."
            )
        else:
            return pb2.DeleteResponse(
                success=False,
                message=result["message"]
            )


async def serve():
    server = grpc.aio.server()
    pb2_grpc.add_VectorizerServiceServicer_to_server(
        VectorizerService(), server
    )
    server.add_insecure_port("[::]:50051")
    await server.start()
    print("Python gRPC server started on port 50051...")
    await server.wait_for_termination()

if __name__ == "__main__":
    asyncio.run(serve())
