import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../../i18n/LanguageContext";
import { useTheme } from "../../store/ThemeContext";
import { getTaskById, updateTaskStatus, getTaskStatusList, addTaskComment, Task, TaskStatus, TaskComment } from "../../services/taskService";
import {
  getPageCardStyle,
} from "../../utils/pageCardStyles";

interface TaskDetailScreenProps {
  task: Task;
  onBack: () => void;
}

const TaskDetailScreen = ({ task: initialTask, onBack }: TaskDetailScreenProps) => {
  const { language, t } = useLanguage();
  const { theme, themeColors } = useTheme();
  const [task, setTask] = useState<Task>(initialTask);
  const [loading, setLoading] = useState(false);
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);
  const [statusList, setStatusList] = useState<TaskStatus[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!initialTask.name) return;
      try {
        setLoading(true);
        const details = await getTaskById(initialTask.name);
        if (details) {
          setTask(details);
        }
      } catch (err) {
        console.error("[TaskDetailScreen] Failed to fetch details:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [initialTask.name]);

  const openStatusSheet = async () => {
    setStatusSheetOpen(true);
    setStatusLoading(true);
    try {
      const statuses = await getTaskStatusList();
      setStatusList(statuses);
    } catch (err) {
      console.error("[TaskDetailScreen] Failed to fetch status list:", err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleStatusSelect = async (status: string) => {
    if (!task.name) return;
    try {
      setUpdatingStatus(true);
      await updateTaskStatus(task.name, status);
      setTask((prev) => ({ ...prev, status }));
      setStatusSheetOpen(false);
    } catch (err: any) {
      console.error("[TaskDetailScreen] Failed to update status:", err);
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !task.name) return;
    try {
      setSubmittingComment(true);
      await addTaskComment(task.name, commentText.trim());
      const refreshed = await getTaskById(task.name);
      if (refreshed) {
        setTask(refreshed);
      }
      setCommentText("");
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err: any) {
      console.error("[TaskDetailScreen] Failed to add comment:", err);
      alert(err.message || "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const statusColors: Record<string, { bg: string; text: string }> = {
    Open: { bg: "bg-gray-100", text: "text-gray-700" },
    Working: { bg: "bg-blue-100", text: "text-blue-700" },
    "In Progress": { bg: "bg-blue-100", text: "text-blue-700" },
    Completed: { bg: "bg-green-100", text: "text-green-700" },
    Closed: { bg: "bg-green-100", text: "text-green-700" },
    Cancelled: { bg: "bg-red-100", text: "text-red-700" },
    "On Hold": { bg: "bg-yellow-100", text: "text-yellow-700" },
    Pending: { bg: "bg-orange-100", text: "text-orange-700" },
    Review: { bg: "bg-purple-100", text: "text-purple-700" },
  };

  const priorityColors: Record<string, { bg: string; text: string }> = {
    Low: { bg: "bg-gray-100", text: "text-gray-600" },
    Medium: { bg: "bg-yellow-100", text: "text-yellow-700" },
    High: { bg: "bg-orange-100", text: "text-orange-700" },
    Urgent: { bg: "bg-red-100", text: "text-red-700" },
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cardClass = getPageCardStyle(theme);

  const comments: TaskComment[] = task.comments || [];

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-full"
          style={{ color: themeColors.textSecondary }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold" style={{ color: themeColors.text }}>{t("taskDetails") || "Task Details"}</h1>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className={`${cardClass} p-6 animate-pulse`}>
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i}>
                  <div className="h-3 w-20 bg-gray-200 rounded mb-1" />
                  <div className="h-4 w-28 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[task.status]?.bg || "bg-gray-100"} ${statusColors[task.status]?.text || "text-gray-700"}`}>
              {task.status}
            </span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]?.bg || "bg-gray-100"} ${priorityColors[task.priority]?.text || "text-gray-700"}`}>
              {task.priority}
            </span>
          </div>

          <div className={`${cardClass} p-5 space-y-4`}>
            <div>
              <p className="text-xs font-medium mb-1" style={{ color: themeColors.textSecondary }}>{t("subject") || "Subject"}</p>
              <p className="text-lg font-bold" style={{ color: themeColors.text }}>{task.subject || "-"}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: themeColors.textSecondary }}>{t("project") || "Project"}</p>
                <p className="text-sm font-semibold" style={{ color: themeColors.text }}>{task.project || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: themeColors.textSecondary }}>{t("dueDate") || "Due Date"}</p>
                <p className="text-sm font-semibold" style={{ color: themeColors.text }}>{formatDate(task.due_date)}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: themeColors.textSecondary }}>{t("assignedBy") || "Assigned By"}</p>
                <p className="text-sm font-semibold" style={{ color: themeColors.text }}>{task.assigned_by || "-"}</p>
              </div>
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: themeColors.textSecondary }}>{t("assignedUsers") || "Assigned Users"}</p>
                <p className="text-sm font-semibold" style={{ color: themeColors.text }}>{task.assigned_users || "-"}</p>
              </div>
            </div>

            {task.description && (
              <div>
                <p className="text-xs font-medium mb-1" style={{ color: themeColors.textSecondary }}>{t("description") || "Description"}</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: themeColors.text }}>{task.description}</p>
              </div>
            )}
          </div>

          <button
            onClick={openStatusSheet}
            className="w-full py-3 px-6 rounded-xl font-semibold transition-colors"
            style={{ backgroundColor: themeColors.primary, color: "#000" }}
          >
            {t("updateStatus") || "Update Status"}
          </button>

          <div className={`${cardClass} p-5`}>
            <h3 className="font-semibold mb-4" style={{ color: themeColors.text }}>
              {t("comments") || "Comments"} {comments.length > 0 && `(${comments.length})`}
            </h3>

            {comments.length === 0 ? (
              <p className="text-sm text-center py-4" style={{ color: themeColors.textSecondary }}>
                {t("noComments") || "No comments yet"}
              </p>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {comments.map((comment, index) => (
                  <motion.div
                    key={comment.name || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl p-3"
                    style={{ background: themeColors.background }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color: themeColors.text }}>
                        {comment.comment_by || comment.comment_email || "Unknown"}
                      </span>
                      <span className="text-[10px]" style={{ color: themeColors.textSecondary }}>
                        {formatDateTime(comment.creation)}
                      </span>
                    </div>
                    <p className="text-sm" style={{ color: themeColors.text }}>{comment.comment}</p>
                  </motion.div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                placeholder={t("addComment") || "Add a comment..."}
                className="flex-1 p-3 rounded-xl text-sm focus:outline-none focus:ring-2"
                style={{
                  background: themeColors.background,
                  border: `1px solid ${themeColors.border}`,
                  color: themeColors.text,
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={submittingComment || !commentText.trim()}
                className="px-4 rounded-xl font-medium transition-colors disabled:opacity-50"
                style={{ backgroundColor: themeColors.primary, color: "#000" }}
              >
                {submittingComment ? (
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </>
      )}

      <AnimatePresence>
        {statusSheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/40 z-50"
              onClick={() => setStatusSheetOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl shadow-2xl p-5 pb-8 max-h-[70vh] overflow-y-auto"
              style={{ background: themeColors.backgroundSecondary }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: themeColors.text }}>
                  {t("updateStatus") || "Update Status"}
                </h3>
                <button
                  onClick={() => setStatusSheetOpen(false)}
                  className="p-1 rounded-full"
                  style={{ color: themeColors.textSecondary }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {statusLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {statusList.map((statusItem) => {
                    const isActive = task.status === statusItem.name;
                    return (
                      <button
                        key={statusItem.name}
                        onClick={() => handleStatusSelect(statusItem.name)}
                        disabled={updatingStatus || isActive}
                        className="w-full p-4 rounded-xl text-left flex items-center justify-between transition-colors disabled:opacity-50"
                        style={{
                          background: isActive ? themeColors.primary + "20" : themeColors.background,
                          border: `1px solid ${isActive ? themeColors.primary : themeColors.border}`,
                        }}
                      >
                        <span className="font-medium" style={{ color: themeColors.text }}>
                          {statusItem.label || statusItem.name}
                        </span>
                        {isActive && (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: themeColors.primary, color: "#000" }}>
                            {t("current") || "Current"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TaskDetailScreen;
