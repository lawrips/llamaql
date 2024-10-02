import React, { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';

const CreateTableModal = ({ open, handleCreateTable, handleCancelTable, createTableCount, createModal }) => {
    const [tableName, setTableName] = useState('');

    // Reset tableName when the dialog is opened
    useEffect(() => {
        if (open) {
            setTableName('');
        }
    }, [open]);

    const isCreateDisabled = tableName.trim() === '';

    const onCreateClick = () => {
        handleCreateTable(tableName);
    };

    return (
        <Dialog
            open={open}
            onClose={null} // Disable automatic onClose (we'll control it ourselves)
            disableEscapeKeyDown // Prevent closing with the "Esc" key
            disableBackdropClick // Prevent closing by clicking the backdrop
        >
            <DialogTitle>Table Management</DialogTitle>
            <DialogContent>
                {createModal == true ? <div>Create a table of {createTableCount} rows?</div> : <div>Delete a table by entering its name</div>}
                <br />
                <TextField
                    label="Table Name"
                    fullWidth
                    autoComplete="off"
                    id="customField22"      
                    required
                    variant="outlined"
                    value={tableName}
                    onChange={(e) => { setTableName(e.target.value) }}
                    className="custom-mui-textfield"
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancelTable}>Cancel</Button>
                <Button onClick={onCreateClick} disabled={isCreateDisabled}>
                    Confirm
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateTableModal;
