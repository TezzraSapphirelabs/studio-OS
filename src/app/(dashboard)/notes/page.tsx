import { EmptyState } from '@/components';
import { FileTextIcon } from '@/components/icons';

export default function NotesEmptyPage() {
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState 
        icon={<FileTextIcon size={36} />}
        title="Select a Note"
        description="Choose a note from the sidebar to view or edit its contents, or create a new note to get started."
      />
    </div>
  );
}
