import { profileImportExportService } from '@/services/profile';
import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Controller for handling profile import/export HTTP requests
 */
export class ProfileImportExportController {
  /**
   * Export candidates to CSV
   * GET /api/profiles/export/candidates
   */
  async exportCandidates(req: Request, res: Response): Promise<void> {
    try {
      const csv = await profileImportExportService.exportCandidates();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=candidates_export.csv');
      res.status(200).send(csv);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export candidates',
      });
    }
  }

  /**
   * Export workers to CSV
   * GET /api/profiles/export/workers
   */
  async exportWorkers(req: Request, res: Response): Promise<void> {
    try {
      const csv = await profileImportExportService.exportWorkers();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=workers_export.csv');
      res.status(200).send(csv);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export workers',
      });
    }
  }

  /**
   * Export staff to CSV
   * GET /api/profiles/export/staff
   */
  async exportStaff(req: Request, res: Response): Promise<void> {
    try {
      const csv = await profileImportExportService.exportStaff();

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=staff_export.csv');
      res.status(200).send(csv);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export staff',
      });
    }
  }

  /**
   * Import candidates from CSV file
   * POST /api/profiles/import/candidates
   */
  async importCandidates(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'CSV file is required',
        });
        return;
      }

      const csvData = req.file.buffer.toString('utf-8');

      const options = {
        skipDuplicates: req.body.skipDuplicates === 'true',
        updateExisting: req.body.updateExisting === 'true',
      };

      const createdByProfileId = req.user?.id;

      const result = await profileImportExportService.importCandidates(
        csvData,
        options,
        createdByProfileId
      );

      res.status(200).json({
        success: true,
        message: 'Import completed',
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to import candidates',
      });
    }
  }

  /**
   * Download candidate import template
   * GET /api/profiles/import/templates/candidates
   */
  async downloadCandidateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templatePath = path.join(__dirname, '../../csv_formats/candidate_import_template.csv');

      if (fs.existsSync(templatePath)) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=candidate_import_template.csv');
        const fileStream = fs.createReadStream(templatePath);
        fileStream.pipe(res);
      } else {
        // Fallback: generate template from service
        const csv = profileImportExportService.getCandidateTemplate();
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=candidate_import_template.csv');
        res.status(200).send(csv);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to download template',
      });
    }
  }

  /**
   * Download candidate import sample with data
   * GET /api/profiles/import/samples/candidates
   */
  async downloadCandidateSample(req: Request, res: Response): Promise<void> {
    try {
      const samplePath = path.join(__dirname, '../../csv_formats/candidate_import_sample.csv');

      if (fs.existsSync(samplePath)) {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=candidate_import_sample.csv');
        const fileStream = fs.createReadStream(samplePath);
        fileStream.pipe(res);
      } else {
        res.status(404).json({
          success: false,
          message: 'Sample file not found',
        });
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to download sample',
      });
    }
  }
}

export default new ProfileImportExportController();
