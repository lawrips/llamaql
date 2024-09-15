import React from 'react';
import { useEffect, useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

const ModalDialog = ({ open, handleDialogClose, handleDialogCancel, title, content }) => {

  return (
    <Dialog
      open={open}
      onClose={null} // Disable automatic onClose (we'll control it ourselves)
      disableEscapeKeyDown // Prevent closing with the "Esc" key
      disableBackdropClick // Prevent closing by clicking the backdrop
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
      <Typography
          dangerouslySetInnerHTML={{ __html: content }}
        />      </DialogContent>
      <DialogActions>
      <Button onClick={handleDialogClose}>OK</Button>
      {handleDialogCancel ? <Button onClick={handleDialogCancel}>Cancel</Button> : null}
      </DialogActions>
    </Dialog>
  );
};

export default ModalDialog;
