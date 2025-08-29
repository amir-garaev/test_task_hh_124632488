import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import App from "./App";
import Login from "./pages/Login";
import Resumes from "./pages/Resumes";
import ResumeView from "./pages/ResumeView";
import ResumeCreate from "./pages/ResumeCreate"; 

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route element={<App />}>
        <Route index element={<Navigate to="/resumes" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/resumes" element={<Resumes />} />
        <Route path="/resumes/new" element={<ResumeCreate />} /> 
        <Route path="/resumes/:id" element={<ResumeView />} />
      </Route>
    </Routes>
  </BrowserRouter>
);
