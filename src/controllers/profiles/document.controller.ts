import documentService from '@/services/profiles/document.service';
import catchAsync from '@/utils/catchAsync';
import { Request, Response } from 'express';

export const getProfileDocuments = catchAsync(async (req: Request, res: Response) => {
  const profileId = req.params.id;
  const documents = await documentService.getProfileDocuments(profileId);

  res.status(200).json({
    success: true,
    data: documents,
  });
});

export const addDocument = catchAsync(async (req: Request, res: Response) => {
  const document = await documentService.createDocument(req.body);

  res.status(201).json({
    success: true,
    message: 'Document added successfully',
    data: document,
  });
});

export const updateDocument = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.documentId;
  const document = await documentService.updateDocument(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Document updated successfully',
    data: document,
  });
});

export const verifyDocument = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.documentId;
  const document = await documentService.verifyDocument(id, req.body);

  res.status(200).json({
    success: true,
    message: 'Document verified successfully',
    data: document,
  });
});

export const deleteDocument = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.documentId;
  await documentService.deleteDocument(id);

  res.status(200).json({
    success: true,
    message: 'Document deleted successfully',
  });
});
