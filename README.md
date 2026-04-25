# Venture Log — React App

This project is now organized as a standard React + Vite app with client-side routing.

## Tech stack

- React 18
- React Router DOM 6
- Vite 5

## Project structure

- `src/main.jsx` — app bootstrap + router provider
- `src/App.jsx` — top-level layout and route table
- `src/components/` — reusable UI components (`Sidebar`, `Cards`)
- `src/pages/` — route pages (`Dashboard`, `Ideas`, `Projects`, `Plans`)
- `src/styles.css` — global styles and resets

## Scripts

- `npm install` — install dependencies
- `npm run dev` — run locally
- `npm run build` — production build
- `npm run preview` — preview production build

## Routes

- `/` Dashboard
- `/ideas` Ideas list
- `/ideas/new` New idea form
- `/projects` Projects list
- `/plans` Plans list
- `/plans/:planId` Plan details
