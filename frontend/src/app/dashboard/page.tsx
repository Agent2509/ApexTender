"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser, RedirectToSignIn } from "@clerk/nextjs";
import { Folder, Plus, Trash2, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Project {
  id: string;
  name: string;
  description?: string;
}

export default function DashboardPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const API = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL;

  const getHeaders = async (): Promise<Record<string, string>> => {
    const token = await getToken();
    return { Authorization: token ? `Bearer ${token}` : "Bearer mock-dev-token" };
  };

  const fetchProjects = async () => {
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/projects`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (e) {
      console.error("Failed to fetch projects", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && isSignedIn) fetchProjects();
  }, [isLoaded, isSignedIn]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreatingProject(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/projects`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjects((prev) => [...prev, data]);
        setNewProjectName("");
        setNewProjectDesc("");
        setIsModalOpen(false);
        router.push(`/projects/${data.id}`);
      }
    } catch (e) {
      console.error("Failed to create project", e);
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!confirm("Delete this project and all associated documents?")) return;
    try {
      const headers = await getHeaders();
      const res = await fetch(`${API}/api/v1/projects/${id}`, { method: "DELETE", headers });
      if (res.ok) setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error("Failed to delete project", e);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSignedIn) return <RedirectToSignIn />;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">RFP Projects</h2>
          <p className="text-muted-foreground">
            Manage your bidding projects and document ingestion.
          </p>
        </div>
        {projects.length > 0 && (
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-24" />
            </Card>
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed bg-card/50 text-center shadow-sm">
          <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
              <Folder className="h-10 w-10 text-primary" />
            </div>
            <h2 className="mt-6 text-xl font-semibold">No projects found</h2>
            <p className="mb-8 mt-2 text-center text-sm font-normal leading-6 text-muted-foreground">
              You haven&apos;t created any RFP projects yet. Create your first project to start ingesting documents and running AI extractions.
            </p>
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground text-base">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First RFP Project
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md"
              onClick={() => router.push(`/projects/${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold truncate pr-4 group-hover:text-primary transition-colors">
                    {project.name}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all -mt-2 -mr-2"
                    onClick={(e) => handleDeleteProject(project.id, e)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                  {project.description || "No description provided."}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between text-sm text-muted-foreground pt-0">
                <span className="font-mono text-xs">ID: {project.id.slice(0, 8)}</span>
                <ArrowRight className="h-4 w-4 transform transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Project</DialogTitle>
            <DialogDescription>
              Give your new RFP project a name and optional description.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g. Apollo RFP"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description..."
                value={newProjectDesc}
                onChange={(e) => setNewProjectDesc(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={isCreatingProject || !newProjectName.trim()} className="bg-primary hover:bg-primary/90 text-primary-foreground">
              {isCreatingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreatingProject ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
