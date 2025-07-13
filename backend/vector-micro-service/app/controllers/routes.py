
################################# SCRAPPED #######################################
############################# SHIFTED TO gRPC ####################################



# from fastapi import APIRouter, UploadFile, Form, HTTPException
# import tempfile
# import os
# from app.models.schema import GeneralRequest, QueryRequest
# from app.services.vector_ops import (
#     process_pdf_to_chunks,
#     insert_chunks_to_vectorstore,
#     query_chunks,
#     delete_chunks,
#     count_chunks,
# )

# router = APIRouter()


# ## Route to handle pdf chunking and entering in DB.
# @router.post("/vectorize")
# async def vectorize_doc(
#     user_id: str = Form(...),
#     chat_id: str = Form(...),
#     file_id: str = Form(...),
#     file: UploadFile = None,
# ):
#     try:
#         # Save uploaded file temporarily
#         with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
#             contents = await file.read()
#             tmp.write(contents)
#             tmp_path = tmp.name

#         # Process the PDF
#         success, result = process_pdf_to_chunks(
#             user_id,
#             chat_id,
#             file_id,
#             tmp_path,
#             file.filename
#         )

#         os.unlink(tmp_path)

#         if not success:
#             raise HTTPException(
#                 status_code=500,
#                 detail={
#                     "stage": "processing",
#                     "error_type": result["error_type"],
#                     "message": result["message"],
#                 },
#             )

#         ids, docs, mdatas = result
#         success_insert, error_insert = insert_chunks_to_vectorstore(ids, docs, mdatas)

#         if not success_insert:
#             raise HTTPException(
#                 status_code=500,
#                 detail={
#                     "stage": "insertion",
#                     "error_type": error_insert["error_type"],
#                     "message": error_insert["message"],
#                 },
#             )

#         return {
#             "message": "Vectorized successfully!",
#             "chunks": len(ids),
#         }

#     except Exception as e:
#         raise HTTPException(
#             status_code=500,
#             detail=str(e),
#         )


# @router.post("/query")
# def query_vectors(req: QueryRequest):
#     success, result = query_chunks(
#         req.user_id, req.chat_id, req.file_id, req.k, req.query
#     )

#     if not success:
#         raise HTTPException(
#             status_code=500,
#             detail={
#                 "stage": "query processing",
#                 "error_type": result["error_type"],
#                 "message": result["message"],
#             },
#         )

#     # Success !
#     return {"message": "Queried VectorDB successfully!", "result": result}


# @router.delete("/delete")
# def delete_vectors(req: GeneralRequest):
#     success, delete_error = delete_chunks(req.user_id, req.chat_id, req.file_id)

#     if not success:
#         raise HTTPException(
#             status_code=500,
#             detail={
#                 "stage": "deletion processing",
#                 "error_type": delete_error["error_type"],
#                 "message": delete_error["message"],
#             },
#         )

#     # Success !
#     return {"message": "Deleted File Chunks successfully!"}


# @router.post("/count")
# def count_vectors(req: GeneralRequest):
#     success, result = count_chunks(req.user_id, req.chat_id, req.file_id)

#     if not success:
#         raise HTTPException(
#             status_code=500,
#             detail={
#                 "stage": "count processing",
#                 "error_type": result["error_type"],
#                 "message": result["message"],
#             },
#         )
#     # Success !
#     return {
#         "message": "Vectors for the document fetched succesully!",
#         "count": result,
#     }
