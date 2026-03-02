import ResumeViewer from "./ResumeViewer";

export default function Index() {
  // This Index page serves as a resume showcase/profile page
  // It uses the same ResumeViewer component to ensure consistent 
  // rendering and dynamic calculations, avoiding code duplication
  return <ResumeViewer />;
}
