/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { json } from 'body-parser';
import express from 'express';
import { AppModule } from './app/app.module';
import { fetchAndSaveData } from './app/data-fetcher';
import { publishEvent } from './app/event-publisher';
import { uploadAndParseFile } from './app/file-uploader';
import { searchDatabase } from './app/search-api';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;

  const server = express();
  server.use(json());

  // Streamed Data Fetching & File Saving
  server.get('/fetch-data', async (req, res) => {
    try {
      await fetchAndSaveData();
      res.status(200).send('Data fetched and saved successfully.');
    } catch (error) {
      res.status(500).send(`Error: ${error.message}`);
    }
  });

  // File Upload & Parsing
  server.post('/upload-file', async (req, res) => {
    try {
      await uploadAndParseFile(req);
      res.status(200).send('File uploaded and parsed successfully.');
    } catch (error) {
      res.status(500).send(`Error: ${error.message}`);
    }
  });

  // Search API
  server.get('/search', async (req, res) => {
    try {
      const results = await searchDatabase(req.query);
      res.status(200).json(results);
    } catch (error) {
      res.status(500).send(`Error: ${error.message}`);
    }
  });

  // Time-Series Event Publication
  server.post('/publish-event', async (req, res) => {
    try {
      await publishEvent(req.body);
      res.status(200).send('Event published successfully.');
    } catch (error) {
      res.status(500).send(`Error: ${error.message}`);
    }
  });

  app.use(server);

  await app.listen(port);
  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`);
}

bootstrap();
