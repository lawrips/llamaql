import React, { useEffect, useState } from 'react';
import ModalDialog from './ModalDialog'; 

const TermsModal = () => {
  const [isCookieFound, setIsCookieFound] = useState(false);
  const [open, setOpen] = useState(true); // Control modal visibility

  useEffect(() => {
    // Check if the cookie for the TermsModal exists
    const cookie = document.cookie.split('; ').find(row => row.startsWith('termsAccepted=true'));

    // If the cookie is found, prevent the modal from opening
    setIsCookieFound(!!cookie);
    setOpen(!cookie); // Set open to false if the cookie is found
  }, []);

  const handleClose = () => {
    // Set cookie to prevent the modal from showing again (cookie expires in 1 year)
    document.cookie = "termsAccepted=true; path=/; max-age=31536000"; 
    setIsCookieFound(true); // Mark the cookie as found
    setOpen(false); // Close the modal
  };

  return (
    <div>
      {/* Conditionally render the modal if the cookie is not found */}
      {!isCookieFound && (
        <ModalDialog
          open={open}
          handleClose={handleClose}
          title="Disclaimer"
          content={`This is an early research prototype. By using it, you agree to:<br/><br/>
            - You are responsible for the content you upload. Ensure you have the rights.<br/>
            - Uploaded data and queries will be processed by third-party APIs (e.g., OpenAI).<br/>
            - We are not liable for any direct, indirect, incidental, or consequential damages arising from your use of the app or its outputs.<br/>
            - Your data may be stored for processing or improvements.<br/>
            - Do not upload sensitive, personal, or illegal information.<br/>
            - The app is provided "as-is," without warranties of any kind.<br/><br/>
            By using it you agree to this and the full <a target='_blank' href='/terms.html'>Terms and Conditions found here</a>`}
        />
      )}
    </div>
  );
};

export default TermsModal;
