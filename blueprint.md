# HAMDEVA Blueprint

## Project Overview

HAMDEVA is a global AI-powered virtual try-on platform.

Users upload:

1. A person image
2. A clothing image

The system generates a photorealistic result showing the person wearing the clothing.

Primary goals:

* fast AI generation
* mobile friendly
* viral sharing
* scalable global architecture

---

# Architecture

Frontend

React + Vite + TypeScript

Hosting

Firebase Hosting

Domain

Cloudflare DNS

Backend

Google Cloud Run (Node.js Express)

AI Model

Google Gemini image generation

---

# System Flow

User uploads images

Browser
↓
Firebase Hosting
↓
Cloud Run API
↓
Gemini AI
↓
Generated image returned
↓
Frontend display

---

# Repository Structure

root

src/
App.tsx
main.tsx
index.css

server/
index.js
package.json
Dockerfile

public/

---

# Frontend Responsibilities

Frontend handles:

* image upload
* preview
* API request
* result display
* download
* usage counter
* localization
* UI layout

Frontend must never contain API keys.

---

# Backend Responsibilities

Cloud Run API handles:

* secure Gemini API calls
* image processing
* request validation
* response formatting

Endpoint:

POST /generate

Request:

{
personImage: base64,
garmentImage: base64
}

Response:

{
image: base64
}

---

# Deployment

Frontend

Firebase Hosting

Backend

Cloud Run

Region

asia-northeast3

---

# Performance Rules

Always follow these rules:

1. Minimize API calls
2. Cache repeated generations
3. Resize large images before sending to AI
4. Avoid blocking UI
5. Optimize mobile performance

---

# Security Rules

Never expose:

Gemini API keys

API keys must remain inside backend.

Frontend only communicates with Cloud Run.

---

# UI Design Principles

Simple interface

3 main steps:

Upload person photo
Upload clothing photo
Generate result

Focus on:

* fast interaction
* minimal clicks
* clear CTA

---

# Monetization Plan

Phase 1

AdSense ads

Phase 2

Premium generation limits

Phase 3

Affiliate clothing links

Shop this look

---

# Growth Strategy

HAMDEVA growth relies on:

User-generated content

Features planned:

Outfit Gallery
Daily Outfit Challenge
Share to social platforms
Leaderboard

---

# Future Infrastructure

Image storage

Google Cloud Storage

User authentication

Firebase Auth

Analytics

Google Analytics

CDN

Cloudflare

---

# Development Rules For AI Assistants

When modifying code:

Do NOT refactor entire files.

Modify only necessary sections.

Preserve UI components.

Avoid adding heavy dependencies.

Keep code production ready.

Explain changes clearly.

---

# AI Assistant Role

Act as a senior full-stack engineer.

Goals:

Improve stability
Improve scalability
Reduce AI costs
Enhance user experience
