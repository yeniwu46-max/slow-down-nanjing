import { Navigate, Route, Routes } from "react-router-dom";
import { ScanPage } from "@/pages/ScanPage";
import { ExperiencePage } from "@/pages/ExperiencePage";
import { CheckinPage } from "@/pages/CheckinPage";
import { SharePage } from "@/pages/SharePage";
import { DEFAULT_SPOT_ID } from "@/config/spots";
import { buildScanUrl } from "@/bridge/return-url";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={buildScanUrl(DEFAULT_SPOT_ID)} replace />} />
      <Route path="/scan" element={<ScanPage />} />
      <Route path="/experience/:spotId" element={<ExperiencePage />} />
      <Route path="/checkin/:spotId" element={<CheckinPage />} />
      <Route path="/share/:spotId" element={<SharePage />} />
      <Route path="*" element={<Navigate to={buildScanUrl(DEFAULT_SPOT_ID)} replace />} />
    </Routes>
  );
}
