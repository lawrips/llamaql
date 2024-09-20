import React from 'react';
import { Share } from 'lucide-react';
import ModalDialog from '@/components/ModalDialog';
import { useState } from 'react';
import { useSession } from "next-auth/react";

const ShareButton = ({ appName }) => {
    const { data: session } = useSession(); // Get session data
    const [shareCompletedDialogOpen, setShareCompletedDialogOpen] = useState(false);
    const [shareConfirmDialogOpen, setShareConfirmDialogOpen] = useState(false);
    const [url, setUrl] = useState('');
    
    const handleDialogConfirm = async () => {
        setShareConfirmDialogOpen(false);
        setShareCompletedDialogOpen(true);

        try {
            const response = await fetch(`/api/protected/app/${appName}/share`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              });
    
            if (!response.ok) {
              throw new Error('Share failed');
            }
    
            const result = await response.json();
    
    
            setUrl(`http://llamql.com/${result.hash}`)
            return result;
          } catch (error) {
            console.error('Error in postData:', error);
            throw error;
          }

    }
    const handleDialogCancel = async () => {
        setShareCompletedDialogOpen(false);
        setShareConfirmDialogOpen(false);
    }
    const handleDialogCompleted = async () => {
        setShareCompletedDialogOpen(false);
        setUrl("")
    }
    const shareApp = async () => {
        setShareConfirmDialogOpen(true);
    }



    return (
        <div>
            <Share
                color="black"
                size={28}
                className="cursor-pointer"
                onClick={shareApp} />

            <ModalDialog
                open={shareConfirmDialogOpen}
                handleDialogClose={handleDialogConfirm}
                handleDialogCancel={handleDialogCancel}
                title="Confirmation"
                content={`This will share this app. Continue?`}
            />

            <ModalDialog
                open={shareCompletedDialogOpen}
                handleDialogClose={handleDialogCompleted}
                title="Confirmation"
                content={`App was shared. Use URL ${url}`}
            />


        </div>
    );
};

export default ShareButton;