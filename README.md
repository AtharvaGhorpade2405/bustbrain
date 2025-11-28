# Form Builder with Airtable Integration

This project is a simple full-stack form builder that lets users authenticate with Airtable, select bases and tables, create custom form schemas and collect responses. The backend is built with Node.js, Express and MongoDB, and the frontend uses React with Vite.

## Setup Instructions

The repository contains two folders: `backend` and `frontend`. Before running anything, install dependencies separately in each folder using `npm install`.

The backend requires a MongoDB connection string, Airtable OAuth credentials, Airtable redirect URI, session secret and the frontend URL. These should be added as environment variables on your local machine or in your hosting dashboard. The frontend needs the backend API URL in a `.env` file as `VITE_BACKEND_URL`.

## Airtable OAuth Setup

Create an Airtable developer app and add your backend callback URL in the redirect URI field. The OAuth flow uses the standard authorization code exchange to get an access token and refresh token. After login, the server stores the user’s Airtable profile, tokens and last login timestamp in MongoDB, and then redirects back to the frontend dashboard. Make sure the scopes include read/write access to records, schema permissions and email access.

## Data Model Explanation

There are three main models used in the backend. <br/>
The user model stores the Airtable user ID, email and OAuth tokens. <br/>
The form model contains the owner ID, selected base, selected table and a list of questions that make up the form. Each question stores a key, label, field type, required flag, the Airtable field mapping and optional conditional rules. <br/>
The response model stores the form ID, the Airtable record ID created during submission, the submitted answers and timestamps. Responses also keep a flag for whether the corresponding Airtable record was deleted.

## Conditional Logic Explanation

Each question in a form can have optional conditional rules. These rules determine whether a question should be shown based on answers to previous fields. Every rule checks a specific question key, an operator such as “equals”, “notEquals” or “contains”, and a value. When rendering the form, the frontend evaluates these conditions using the current answers. The backend repeats the same evaluation during form submission to ensure required fields are validated only when they should be visible.

## How to Run the Project

After installing dependencies and setting up environment variables, start the backend with `node app.js` inside the backend folder. Start the frontend with `npm run dev` inside the frontend folder.

## Screenshots
<img width="304" height="270" alt="image" src="https://github.com/user-attachments/assets/5a60e544-641b-454c-81e0-7c5f28eee5fc" /><br/>
<img width="698" height="831" alt="image" src="https://github.com/user-attachments/assets/0c08362d-213c-4749-9960-6f266b562372" /><br/>
<img width="698" height="354" alt="image" src="https://github.com/user-attachments/assets/cd33ff58-f697-4084-9c71-afa60c57282a" /><br/>
<img width="580" height="852" alt="image" src="https://github.com/user-attachments/assets/d248de42-7e49-45b0-a399-d660bd620402" /><br/>
<img width="350" height="315" alt="image" src="https://github.com/user-attachments/assets/043acbb8-3704-4fd2-a159-ed256671a7b7" /><br/>
<img width="443" height="493" alt="image" src="https://github.com/user-attachments/assets/f56ee534-c17a-42cc-90b3-2bc1f5e6198a" /><br/>
<img width="1160" height="287" alt="image" src="https://github.com/user-attachments/assets/7ef57f45-daa4-483a-93a7-482b07fb1617" />






