import { useState } from "react";
import { useLanguage } from "../../i18n/LanguageContext";
import { TravelRequest } from "../../services/travelService";
import TravelScreen from "./TravelScreen";
import TravelListScreen from "./TravelListScreen";
import TravelDetailsScreen from "./TravelDetailsScreen";
import CreateTravelScreen from "./CreateTravelScreen";

type TravelView = "dashboard" | "list" | "details" | "create";

const TravelPage = () => {
  const { t } = useLanguage();
  const [view, setView] = useState<TravelView>("dashboard");
  const [selectedRequest, setSelectedRequest] = useState<TravelRequest | null>(null);

  const handleNavigateToList = () => setView("list");
  const handleNavigateToCreate = () => setView("create");
  const handleNavigateToDetails = (request: TravelRequest) => {
    setSelectedRequest(request);
    setView("details");
  };
  const handleBack = () => setView("dashboard");
  const handleCreateSuccess = () => setView("list");

  switch (view) {
    case "list":
      return (
        <TravelListScreen
          onNavigateToDetails={handleNavigateToDetails}
          onBack={handleBack}
        />
      );
    case "details":
      return selectedRequest ? (
        <TravelDetailsScreen
          request={selectedRequest}
          onBack={() => setView("list")}
        />
      ) : null;
    case "create":
      return (
        <CreateTravelScreen
          onBack={handleBack}
          onSuccess={handleCreateSuccess}
        />
      );
    default:
      return (
        <TravelScreen
          onNavigateToList={handleNavigateToList}
          onNavigateToCreate={handleNavigateToCreate}
        />
      );
  }
};

export default TravelPage;
