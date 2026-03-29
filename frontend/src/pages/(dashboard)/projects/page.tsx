import * as React from "react";
import { getProjects } from "@/lib/data";
import { Project } from "@/types";
import { ProjectsToolbar } from "@/components/projects/ProjectsToolbar";
import { ProjectsGrid } from "@/components/projects/ProjectsGrid";
import { SendUpdateModal } from "@/components/projects/SendUpdateModal";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { useAppNavigate } from "@/lib/navigation";
import { dropProject } from "@/lib/api/closureApi";
import { Loader2 } from "lucide-react";

const PROJECTS_REFRESH_MS = 15000;

export default function ProjectsPage() {
  const router = useAppNavigate();
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [activeFilter, setActiveFilter] = React.useState("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const [isUpdateModalOpen, setIsUpdateModalOpen] = React.useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = React.useState(false);
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(
    null,
  );
  const [dropReason, setDropReason] = React.useState("");
  const [isDropping, setIsDropping] = React.useState(false);

  const fetchProjects = React.useCallback(async () => {
    setIsLoading(true);
    const data = await getProjects({ status: activeFilter, q: searchQuery });
    setProjects(data);
    setIsLoading(false);
  }, [activeFilter, searchQuery]);

  React.useEffect(() => {
    fetchProjects();
    const intervalId = window.setInterval(fetchProjects, PROJECTS_REFRESH_MS);
    const handleFocus = () => {
      fetchProjects();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchProjects]);

  const handleUpdateClick = (project: Project) => {
    setSelectedProject(project);
    setIsUpdateModalOpen(true);
  };

  const handleCloseClick = (project: Project) => {
    setSelectedProject(project);
    setDropReason("");
    setIsCloseDialogOpen(true);
  };

  const handleConfirmDrop = async () => {
    if (!selectedProject || dropReason.trim().length < 3 || isDropping) {
      return;
    }

    setIsDropping(true);
    try {
      await dropProject(selectedProject.id, dropReason.trim());
      setIsCloseDialogOpen(false);
      setDropReason("");
      await fetchProjects();
    } finally {
      setIsDropping(false);
    }
  };

  const handleReset = () => {
    setActiveFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <ProjectsToolbar
        onSearch={setSearchQuery}
        onFilterChange={setActiveFilter}
        activeFilter={activeFilter}
        onAddClick={() => router.navigate({ to: "/projects/new?step=1" })}
      />

      <ProjectsGrid
        projects={projects}
        isLoading={isLoading}
        onUpdateProject={handleUpdateClick}
        onCloseProject={handleCloseClick}
        onReset={handleReset}
      />

      {/* Modals */}
      <SendUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        project={selectedProject}
      />

      {/* Close Confirm Dialog */}
      <Dialog
        isOpen={isCloseDialogOpen}
        onClose={() => {
          if (!isDropping) {
            setIsCloseDialogOpen(false);
          }
        }}
        title="Drop Project?"
      >
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground leading-relaxed">
            The project{" "}
            <span className="text-white font-bold">
              "{selectedProject?.projectTitle}"
            </span>{" "}
            is not yet completed. Are you sure you want to drop it and notify
            the client?
          </p>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Reason for Project Drop
            </label>
            <textarea
              value={dropReason}
              onChange={(e) => setDropReason(e.target.value)}
              placeholder="Explain clearly why the project is being dropped..."
              className="w-full min-h-28 bg-card p-4 rounded-xl border border-white/10 text-sm focus:ring-2 focus:ring-rose-500/40 focus:outline-none transition-all"
            />
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl">
            <p className="text-xs text-rose-400 font-medium">
              This reason will be stored in the database, the project will move
              to Drop Pending Ack, and it will finalize only after the client
              taps Acknowledged in WhatsApp.
            </p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 rounded-xl font-bold"
              onClick={() => setIsCloseDialogOpen(false)}
              disabled={isDropping}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              className="flex-1 rounded-xl font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/15"
              onClick={handleConfirmDrop}
              disabled={dropReason.trim().length < 3 || isDropping}
            >
              {isDropping ? (
                <Loader2 size={16} className="mr-2 animate-spin" />
              ) : null}
              Confirm Drop
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
