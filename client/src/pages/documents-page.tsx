import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileArchive, Upload, Search, Download, Eye, FileText, Image, File, User, FolderOpen, X, CheckCircle2, Check, ChevronsUpDown, Building2, Briefcase, Filter } from "lucide-react";
import { usePagination } from "@/hooks/use-pagination";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { User as UserType } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface DocumentRecord {
  id: string;
  name: string;
  type: string;
  description: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  data: string;
  uploadedAt: string;
  employeeId: number;
  employeeName: string;
}

const documentTypeLabels: Record<string, string> = {
  id_proof: "ID Proof",
  certificate: "Certificate",
  offer_letter: "Offer Letter",
  photo: "Photo",
  bank_document: "Bank Document",
  educational: "Educational",
  experience_letter: "Experience Letter",
  other: "Other",
};

const categoryToTypes: Record<string, string[]> = {
  "ID Proofs": ["id_proof"],
  "Certificates": ["certificate", "educational", "experience_letter"],
  "Offer Letters": ["offer_letter"],
  "Photos": ["photo"],
};

const documentUploadSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  documentType: z.string().min(1, "Please select a document type"),
  documentName: z.string().min(1, "Document name is required"),
  description: z.string().optional(),
});

type DocumentUploadForm = z.infer<typeof documentUploadSchema>;

export default function DocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
  const [viewDocument, setViewDocument] = useState<DocumentRecord | null>(null);
  const [selectedEmployeeForDocs, setSelectedEmployeeForDocs] = useState<UserType | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery<UserType[]>({
    queryKey: ['/api/employees'],
  });

  const { data: units = [] } = useQuery<{ id: number; name: string; code: string }[]>({
    queryKey: ['/api/masters/units'],
  });

  const { data: departments = [], isLoading: isLoadingDepts } = useQuery<{ id: number; name: string; unitId?: number }[]>({
    queryKey: ['/api/departments'],
  });

  useEffect(() => {
    if (units.length > 0 && selectedUnit === "all") {
      const cybaemUnit = units.find(u => u.name?.toLowerCase().includes("cybaem"));
      if (cybaemUnit) {
        setSelectedUnit(cybaemUnit.id.toString());
      }
    }
  }, [units, selectedUnit]);

  const form = useForm<DocumentUploadForm>({
    resolver: zodResolver(documentUploadSchema),
    defaultValues: {
      employeeId: "",
      documentType: "",
      documentName: "",
      description: "",
    },
  });

  // Helper to parse documents for an employee
  const getEmployeeDocs = (employee: UserType): DocumentRecord[] => {
    const docs: DocumentRecord[] = [];
    if (employee.photoUrl) {
      docs.push({
        id: `profile-photo-${employee.id}`,
        name: `Profile Photo`,
        type: 'photo',
        description: 'Employee profile photo',
        fileName: `profile-${employee.id}.jpg`,
        fileSize: 0,
        mimeType: 'image/jpeg',
        data: employee.photoUrl,
        uploadedAt: new Date().toISOString(),
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
      });
    }
    if (employee.documents && Array.isArray(employee.documents)) {
      employee.documents.forEach((docData: any) => {
        try {
          const doc = typeof docData === 'string' ? JSON.parse(docData) : docData;
          if (!doc) return;
          docs.push({
            id: doc.id || Date.now().toString() + Math.random(),
            name: doc.name || doc.fileName || "Untitled",
            type: doc.type || "other",
            description: doc.description || "",
            fileName: doc.fileName || "unknown",
            fileSize: doc.fileSize || 0,
            mimeType: doc.mimeType || "application/octet-stream",
            data: doc.data || "",
            uploadedAt: doc.uploadedAt || new Date().toISOString(),
            employeeId: employee.id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
          });
        } catch (e) { }
      });
    }
    return docs;
  };

  const filteredEmployees = useMemo(() => {
    let list = employees.filter(e => e.firstName && e.lastName);

    // Filter by unit
    if (selectedUnit !== "all") {
      const unitId = parseInt(selectedUnit);
      list = list.filter(emp => {
        const dept = departments.find(d => d.id === emp.departmentId);
        return dept?.unitId === unitId;
      });
    }

    // Filter by department
    if (selectedDepartment !== "all") {
      const deptId = parseInt(selectedDepartment);
      list = list.filter(emp => emp.departmentId === deptId);
    }

    // Filter by search query (Name or Emp ID)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(emp =>
        `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(query) ||
        (emp.employeeId || "").toLowerCase().includes(query)
      );
    }

    // Filter by Category (if selected, show employees with at least one doc in that category)
    if (selectedCategory && categoryToTypes[selectedCategory]) {
      const types = categoryToTypes[selectedCategory];
      list = list.filter(emp => {
        const docs = getEmployeeDocs(emp);
        return docs.some(d => types.includes(d.type));
      });
    }

    return list;
  }, [employees, selectedUnit, selectedDepartment, searchQuery, selectedCategory, departments]);

  const pagination = usePagination(filteredEmployees, 50); // Show more per page for higher density

  const handleDownload = (doc: DocumentRecord) => {
    if (doc.data) {
      const link = document.createElement('a');
      link.href = doc.data;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async (data: DocumentUploadForm) => {
      if (!selectedFile) throw new Error("Please select a file to upload");
      setIsUploading(true);
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
      const base64Data = await base64Promise;
      const employee = employees.find(e => e.id.toString() === data.employeeId);
      if (!employee) throw new Error("Employee not found");

      const documentEntry = JSON.stringify({
        id: Date.now().toString(),
        name: data.documentName,
        type: data.documentType,
        description: data.description || "",
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        mimeType: selectedFile.type,
        data: base64Data,
        uploadedAt: new Date().toISOString(),
      });

      const updatedDocs = [...(employee.documents || []), documentEntry];
      await apiRequest("PUT", `/api/employees/${data.employeeId}`, { documents: updatedDocs });
      return { success: true };
    },
    onSuccess: () => {
      toast({ title: "Document Uploaded", description: "The document has been successfully uploaded." });
      form.reset();
      setSelectedFile(null);
      setIsUploadOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/employees'] });
    },
    onError: (error: Error) => {
      toast({ title: "Upload Failed", description: error.message, variant: "destructive" });
    },
    onSettled: () => setIsUploading(false),
  });

  const onSubmit = (data: DocumentUploadForm) => uploadMutation.mutate(data);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-2xl shadow-lg">
              <FolderOpen className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground dark:text-white tracking-tight">Employee Documents</h1>
              <p className="text-muted-foreground font-medium">Verified repository for all staff certifications & ID proofing</p>
            </div>
          </div>

          <Button
            onClick={() => setIsUploadOpen(true)}
            className="h-12 px-6 !bg-blue-600 hover:!bg-blue-700 text-white font-bold rounded-xl shadow-[0_0_15px_rgba(59,130,246,0.2)] transition-all active:scale-95 border-none"
          >
            <Upload className="h-5 w-5 mr-2" />
            New Document Upload
          </Button>
        </div>

        {/* Category Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.keys(categoryToTypes).map((cat) => (
            <motion.div
              key={cat}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={cn(
                "p-6 rounded-2xl border cursor-pointer transition-all duration-300 relative overflow-hidden group",
                selectedCategory === cat
                  ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5 text-foreground dark:text-white"
                  : "border-border bg-card hover:border-blue-500/30 hover:shadow-md text-card-foreground"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn(
                  "p-2 rounded-xl",
                  selectedCategory === cat ? "bg-blue-600 text-white" : "bg-muted text-muted-foreground group-hover:bg-blue-500/10 group-hover:text-blue-500"
                )}>
                  {cat === "ID Proofs" ? <FileText className="w-5 h-5" /> :
                    cat === "Certificates" ? <FileArchive className="w-5 h-5" /> :
                    cat === "Offer Letters" ? <File className="w-5 h-5" /> : <Image className="w-5 h-5" />}
                </div>
                <Badge variant={selectedCategory === cat ? "default" : "outline"} className="font-black">
                  {employees.reduce((acc, emp) => {
                    const docs = getEmployeeDocs(emp);
                    return acc + docs.filter(d => categoryToTypes[cat].includes(d.type)).length;
                  }, 0)} Files
                </Badge>
              </div>
              <p className="font-bold text-foreground dark:text-white">{cat}</p>
              <p className="text-xs text-muted-foreground font-medium mt-1">Total in Directory</p>
              {selectedCategory === cat && (
                <div className="absolute top-2 right-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Filter Bar */}
        <Card className="border border-border shadow-lg rounded-2xl bg-card backdrop-blur-md overflow-hidden text-card-foreground">
          <div className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-4 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search Emp ID or Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-11 border border-border focus:border-blue-500/50 rounded-xl bg-card text-foreground"
              />
            </div>
            <div className="md:col-span-3">
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger className="h-11 border border-border rounded-xl bg-card text-foreground">
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Select Unit" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {units.map((u, idx) => (
                    <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="h-11 border border-border rounded-xl bg-card text-foreground">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="All Departments" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {Array.from(new Set(departments.map(d => d.name))).map(name => {
                    const dept = departments.find(d => d.name === name);
                    return <SelectItem key={dept?.id} value={dept?.id.toString() || name}>{name}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Badge variant="outline" className="h-11 px-4 border border-border rounded-xl bg-card font-bold text-foreground">
                {filteredEmployees.length} Results
              </Badge>
            </div>
          </div>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/20">
                    <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Employee Details</TableHead>
                    <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Unit / Dept</TableHead>
                    <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Position</TableHead>
                    <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground">Doc Status</TableHead>
                    <TableHead className="py-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-center">Count</TableHead>
                    <TableHead className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {pagination.paginatedItems.map((emp, index) => {
                      const dept = departments.find(d => d.id === emp.departmentId);
                      const unit = units.find(u => u.id === dept?.unitId);
                      const docs = getEmployeeDocs(emp);
                      return (
                        <motion.tr
                          key={emp.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: index * 0.03 }}
                          className="group hover:bg-muted/10 transition-all border-b border-border"
                        >
                          <TableCell className="px-6 py-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center font-bold text-muted-foreground shadow-sm text-[10px]">
                                {emp.firstName?.[0]}{emp.lastName?.[0]}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-foreground text-[13px] leading-tight">{emp.firstName} {emp.lastName}</span>
                                <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter">{emp.employeeId || `EMP-${emp.id}`}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-1">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-foreground">{unit?.name || "Global"}</span>
                              <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">{dept?.name || "Unassigned"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-1">
                            <div className="flex items-center space-x-2">
                              <Briefcase className="w-3 h-3 text-muted-foreground" />
                              <span className="text-[10px] font-semibold text-muted-foreground">{emp.position || "Employee"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-1">
                            <Badge variant={docs.length > 0 ? "default" : "outline"} className={cn(
                              "text-[9px] font-black uppercase py-0",
                              docs.length > 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20" : "text-muted-foreground border-border"
                            )}>
                              {docs.length > 0 ? "Verified" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-1 text-center">
                            <div className="inline-flex items-center justify-center bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-0.5">
                              <span className="text-[10px] font-black text-blue-600 dark:text-blue-300">{docs.length}</span>
                            </div>
                          </TableCell>
                          <TableCell className="px-6 py-1 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedEmployeeForDocs(emp)}
                              className="h-8 px-3 bg-muted/40 border border-border hover:bg-muted/70 text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-bold rounded-lg transition-all text-xs animate-none"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1.5" />
                              View Docs
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            <div className="p-3 bg-card border-t border-border">
              <PaginationBar
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                startIndex={pagination.startIndex}
                endIndex={pagination.endIndex}
                onPageChange={pagination.setCurrentPage}
                itemLabel="employees"
              />
            </div>
          </CardContent>
        </Card>

        {/* Employee Documents Dialog (Detailed List) */}
        <Dialog open={!!selectedEmployeeForDocs} onOpenChange={(open) => !open && setSelectedEmployeeForDocs(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-dialog text-foreground border border-border">
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 p-8 text-white relative border-b border-border">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <FolderOpen className="w-32 h-32" />
              </div>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-5">
                  <div className="w-20 h-20 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center font-black text-3xl shadow-2xl backdrop-blur-md text-slate-200">
                    {selectedEmployeeForDocs?.firstName?.[0]}{selectedEmployeeForDocs?.lastName?.[0]}
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-black mb-1">{selectedEmployeeForDocs?.firstName} {selectedEmployeeForDocs?.lastName}</DialogTitle>
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center text-slate-300 text-sm font-medium border-r border-white/10 pr-3">
                        <User className="w-3.5 h-3.5 mr-1.5" />
                        ID: {selectedEmployeeForDocs?.employeeId || selectedEmployeeForDocs?.id}
                      </div>
                      <div className="flex items-center text-slate-300 text-sm font-medium border-r border-white/10 pr-3">
                        <Briefcase className="w-3.5 h-3.5 mr-1.5 text-blue-300" />
                        {selectedEmployeeForDocs?.position || 'Employee'}
                      </div>
                      <div className="flex items-center text-slate-300 text-sm font-medium">
                        <Building2 className="w-3.5 h-3.5 mr-1.5 text-indigo-300" />
                        {departments.find(d => d.id === selectedEmployeeForDocs?.departmentId)?.name || 'General Dept'}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 font-black px-4 py-1.5 text-xs mb-2">
                    {selectedEmployeeForDocs && getEmployeeDocs(selectedEmployeeForDocs).length} Total Documents
                  </Badge>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">Verified Portfolio</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {selectedEmployeeForDocs && getEmployeeDocs(selectedEmployeeForDocs).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {getEmployeeDocs(selectedEmployeeForDocs).map((doc) => (
                    <Card key={doc.id} className="group border border-border hover:border-blue-500/30 transition-all p-4 rounded-xl relative overflow-hidden bg-muted/20 shadow-md text-foreground">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={cn(
                            "p-2.5 rounded-lg",
                            doc.mimeType === 'application/pdf' ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          )}>
                            {doc.mimeType === 'application/pdf' ? <FileText className="w-5 h-5" /> : <Image className="w-5 h-5" />}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-foreground group-hover:text-blue-500 transition-colors line-clamp-1">{doc.name}</span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground py-0.5">{documentTypeLabels[doc.type] || doc.type}</span>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" onClick={() => setViewDocument(doc)} className="h-8 w-8 text-blue-500 hover:bg-muted animate-none">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDownload(doc)} className="h-8 w-8 text-indigo-500 hover:bg-muted animate-none">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t pt-3 border-border">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                        {doc.fileSize > 0 && <span className="text-[10px] text-muted-foreground font-bold">{(doc.fileSize / 1024).toFixed(0)} KB</span>}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border">
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                  <p className="text-muted-foreground font-bold">No documents found for this employee</p>
                </div>
              )}
            </div>

            <div className="p-6 bg-muted/10 border-t border-border flex justify-end">
              <Button variant="outline" onClick={() => setSelectedEmployeeForDocs(null)} className="h-11 px-8 font-black rounded-xl border border-border bg-transparent text-foreground hover:bg-muted animate-none">Close Portfolio</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Existing Upload Dialog */}
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogContent className="max-w-2xl bg-dialog border border-border text-foreground">
            <DialogHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <DialogTitle className="text-2xl font-black text-foreground">Upload New Record</DialogTitle>
              </div>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="employeeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground">Select Employee</FormLabel>
                        <Popover open={employeeSearchOpen} onOpenChange={setEmployeeSearchOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button variant="outline" className="h-11 w-full justify-between border border-border bg-card text-foreground rounded-xl">
                                {form.watch("employeeId")
                                  ? `${employees.find(e => e.id.toString() === form.watch("employeeId"))?.firstName} ${employees.find(e => e.id.toString() === form.watch("employeeId"))?.lastName}`
                                  : "Search Employee..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Type name..." />
                              <CommandList>
                                <CommandEmpty>No employee found.</CommandEmpty>
                                <CommandGroup>
                                  {employees.filter(e => e.firstName).map(e => (
                                    <CommandItem key={e.id} value={`${e.firstName} ${e.lastName}`} onSelect={() => { form.setValue("employeeId", e.id.toString()); setEmployeeSearchOpen(false); }}>
                                      <Check className={cn("mr-2 h-4 w-4", field.value === e.id.toString() ? "opacity-100" : "opacity-0")} />
                                      {e.firstName} {e.lastName}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="documentType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-bold text-foreground">Document Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 border border-border bg-card text-foreground rounded-xl">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(documentTypeLabels).map(([val, label]) => (
                              <SelectItem key={val} value={val}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="documentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-bold text-foreground">Reference Name</FormLabel>
                      <FormControl><Input className="h-11 border border-border bg-card text-foreground rounded-xl" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="border border-dashed border-border rounded-2xl p-8 text-center bg-muted/10 hover:bg-muted/20 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <input type="file" ref={fileInputRef} onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedFile(f);
                      if (!form.getValues("documentName")) form.setValue("documentName", f.name.replace(/\.[^/.]+$/, ""));
                    }
                  }} className="hidden" />
                  {selectedFile ? (
                    <div className="flex items-center justify-center space-x-3 text-blue-500 font-bold">
                      <CheckCircle2 className="w-8 h-8" />
                      <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                      <X className="w-5 h-5 text-red-500 ml-2" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="w-12 h-12 text-slate-500 mx-auto" />
                      <p className="font-bold text-foreground">Click or Drag File to Upload</p>
                      <p className="text-xs text-muted-foreground">PDF, JPG, PNG, DOC (Max 10MB)</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)} className="flex-1 h-12 font-bold rounded-xl border border-border bg-transparent text-foreground hover:bg-muted transition-all animate-none">Cancel</Button>
                  <Button type="submit" disabled={isUploading || !selectedFile} className="flex-1 h-12 !bg-blue-600 hover:!bg-blue-700 text-white font-black rounded-xl animate-none">
                    {isUploading ? "Uploading Data..." : "Finalize Upload"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Existing View Modal */}
        <Dialog open={!!viewDocument} onOpenChange={(open) => !open && setViewDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-dialog border border-border text-foreground">
            {viewDocument && (
              <>
                <div className="p-6 flex items-center justify-between border-b border-border">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-blue-500" />
                    <span className="font-bold text-foreground">{viewDocument.name}</span>
                  </div>
                  <Button variant="ghost" onClick={() => handleDownload(viewDocument)} className="text-blue-500 hover:bg-muted animate-none">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
                <div className="flex-1 bg-muted/10 overflow-auto p-4 min-h-[500px]">
                  {viewDocument.mimeType.startsWith('image/') ? (
                    <img src={viewDocument.data} className="max-w-full h-auto mx-auto shadow-2xl rounded-lg border border-border" />
                  ) : viewDocument.mimeType === 'application/pdf' ? (
                    <iframe src={viewDocument.data} className="w-full h-full min-h-[600px] border-none bg-white" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <File className="w-20 h-20 text-slate-500 mb-4" />
                      <p className="text-muted-foreground font-bold">Preview not supported for this file type</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
