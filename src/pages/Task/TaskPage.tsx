import { useState } from "react";
import { Task } from "../../services/taskService";
import TaskDashboardCard from "./TaskDashboardCard";
import TaskListScreen from "./TaskListScreen";
import TaskDetailScreen from "./TaskDetailScreen";

type TaskView = "dashboard" | "list" | "detail";

const TaskPage = () => {
  const [view, setView] = useState<TaskView>("dashboard");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const handleNavigateToList = () => setView("list");
  const handleNavigateToDetail = (task: Task) => {
    setSelectedTask(task);
    setView("detail");
  };
  const handleBack = () => setView("dashboard");
  const handleBackToList = () => setView("list");

  switch (view) {
    case "list":
      return (
        <TaskListScreen
          onNavigateToDetail={handleNavigateToDetail}
          onBack={handleBack}
        />
      );
    case "detail":
      return selectedTask ? (
        <TaskDetailScreen
          task={selectedTask}
          onBack={handleBackToList}
        />
      ) : null;
    default:
      return (
        <TaskDashboardCard
          onNavigateToList={handleNavigateToList}
        />
      );
  }
};

export default TaskPage;
