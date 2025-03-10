import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSession } from "next-auth/react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Play } from "lucide-react";
import Switch from 'react-switch';

const InstructionPanel = ({
  displayedQuery,
  setDisplayedQuery,
  queryInstructions,
  setQueryInstructions,
  requeryInstructions,
  setRequeryInstructions,
  dataInstructions,
  setDataInstructions,
  dataExamples,
  dataExplanation,
  setDataExplanation,
  instructSubs,
  checkedItems,
  handleInstructSubChange,
  handleDirectQuery,
  handleSaveInstructions,
  queryTextAreaRef,
  showQueryDetails,
  setShowQueryDetails,
  setDbQuery,
}) => {
  const { data: session } = useSession(); // Get session data
  const [isOpen, setIsOpen] = useState(true);

  const toggleContent = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <Tabs>
        <div className="tab-container">
          <TabList>
            <Tab>SQL Query</Tab>
            {(session.user?.role == 'admin') ?
              <>
                <Tab>Query Instructions</Tab>
                <Tab>Requery Instructions</Tab>
                <Tab>Data Instructions</Tab>
              </>
              : null}
            <Tab>Data Examples</Tab>
            <Tab>Data Explanation</Tab>
          </TabList>
          <div className="collapsible" onClick={toggleContent}>
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </div>
        </div>

        {isOpen && (
          <div className="content">
            <TabPanel>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <textarea
                    ref={queryTextAreaRef}
                    value={displayedQuery}
                    placeholder="SQL Query Will Appear Here"
                    onChange={(e) => { 
                      if (!showQueryDetails) {  // Only allow changes when showQueryDetails is false
                        setDisplayedQuery(e.target.value); 
                        setDbQuery(e.target.value);
                      }
                    }}
                    readOnly={showQueryDetails}  // Make readonly when showQueryDetails is true
                    rows={8}
                    style={{ 
                      border: '1px solid #ddd', 
                      padding: '5px', 
                      width: '95%', 
                      overflowY: 'scroll', 
                      marginBottom: '10px', 
                      whiteSpace: 'pre-wrap',
                      backgroundColor: showQueryDetails ? '#f5f5f5' : 'white'  // Optional: visual feedback for readonly state
                    }}
                  />&nbsp;&nbsp;
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div className="flex items-center mb-2">
                      <span className="mr-2 text-sm">Show Query Details</span>
                      <Switch
                        checked={showQueryDetails}
                        onChange={(checked) => setShowQueryDetails(checked)}
                        onColor="#86d3ff"
                        onHandleColor="#2693e6"
                        handleDiameter={20}
                        uncheckedIcon={false}
                        checkedIcon={false}
                        boxShadow="0px 1px 5px rgba(0, 0, 0, 0.6)"
                        activeBoxShadow="0px 0px 1px 10px rgba(0, 0, 0, 0.2)"
                        height={15}
                        width={35}
                        className="react-switch"
                      />
                    </div>
                    <button className="flex items-center" onClick={handleDirectQuery}>
                      <Play className="h-4 w-4" />&nbsp;Execute
                    </button>
                  </div>
                </div>
              </div>
            </TabPanel>
            {(session.user?.role == 'admin') ?
              <>

                <TabPanel>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <textarea
                      value={queryInstructions}
                      placeholder="Query Instructions"
                      onChange={(e) => setQueryInstructions(e.target.value)}
                      rows={8}
                      style={{ width: '90%', overflowY: 'scroll', marginBottom: '10px' }}
                    />&nbsp;
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      Enable / disable sending of variables in the instructions:<br /><br />
                      {instructSubs.map((item) => (
                        <div key={item}>
                          <label>
                            <input
                              type="checkbox"
                              checked={checkedItems.has(item)}
                              onChange={() => handleInstructSubChange(item)}
                            />&nbsp;
                            {item}
                          </label>
                        </div>
                      ))}
                      <button onClick={handleSaveInstructions} style={{ width: '150px', marginTop: '10px', marginRight: '10px', marginBottom: '10px' }}>Save</button>
                    </div>
                  </div>
                </TabPanel>
                <TabPanel>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <textarea
                      value={requeryInstructions}
                      placeholder="Requery Instructions"
                      onChange={(e) => setRequeryInstructions(e.target.value)}
                      rows={8}
                      style={{ width: '90%', overflowY: 'scroll', marginBottom: '10px' }}
                    />&nbsp;
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      Enable / disable sending of variables in the instructions:<br /><br />
                      {instructSubs.map((item) => (
                        <div key={item}>
                          <label>
                            <input
                              type="checkbox"
                              checked={checkedItems.has(item)}
                              onChange={() => handleInstructSubChange(item)}
                            />&nbsp;
                            {item}
                          </label>
                        </div>

                      ))}
                      <button onClick={handleSaveInstructions} style={{ width: '150px', marginTop: '10px', marginRight: '10px', marginBottom: '10px' }}>Save</button>

                    </div>
                  </div>
                </TabPanel>
                <TabPanel>
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <textarea
                      value={dataInstructions}
                      placeholder="Data Instructions"
                      onChange={(e) => setDataInstructions(e.target.value)}
                      rows={8}
                      style={{ width: '90%', overflowY: 'scroll', marginBottom: '10px' }}
                    />&nbsp;
                    <button onClick={handleSaveInstructions} style={{ width: '150px', marginTop: '10px', marginRight: '10px', marginBottom: '10px' }}>Save</button>
                  </div>

                </TabPanel>
              </>
              : null}
            <TabPanel>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <textarea
                  readonly
                  value={dataExamples}
                  placeholder="Data Examples"
                  //onChange={(e) => setDataExamples(e.target.value)}
                  rows={8}
                  style={{ width: '100%', overflowY: 'scroll', marginBottom: '10px' }}
                />&nbsp;
              </div>
            </TabPanel>
            <TabPanel>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>

                <textarea
                  value={dataExplanation}
                  placeholder="Data Explanation"
                  onChange={(e) => setDataExplanation(e.target.value)}
                  rows={8}
                  style={{ width: '90%', overflowY: 'scroll', marginBottom: '10px' }}
                />&nbsp;
                <button onClick={handleSaveInstructions} style={{ width: '150px', marginTop: '10px', marginRight: '10px', marginBottom: '10px' }}>Save</button>
              </div>

            </TabPanel>
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default InstructionPanel;