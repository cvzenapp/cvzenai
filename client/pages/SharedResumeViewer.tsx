import { useParams } from "react-router-dom";
import ResumeViewer from "./ResumeViewer";

/**
 * SharedResumeViewer Component
 * 
 * This component handles shared resume viewing functionality.
 * It's a wrapper around ResumeViewer since ResumeViewer already
 * contains all the logic for handling shared resumes via shareToken.
 */
export default function SharedResumeViewer() {
  // This component is a wrapper that uses ResumeViewer
  // since ResumeViewer already handles shared resume functionality
  const { shareToken } = useParams();
  
  // Simply render ResumeViewer which already has shared resume logic
  return <ResumeViewer />;
}