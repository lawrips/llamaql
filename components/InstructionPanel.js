import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSession } from "next-auth/react";
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

const InstructionPanel = ({
  dbQuery,
  setDbQuery,
  queryInstructions,
  setQueryInstructions,
  requeryInstructions,
  setRequeryInstructions,
  dataInstructions,
  setDataInstructions,
  dataExamples,
  chatResult,
  setChatResult,
  dataExplanation,
  setDataExplanation,
  instructSubs,
  checkedItems,
  handleInstructSubChange,
  handleDirectQuery,
  handleSaveInstructions
}) => {
  const { data: session } = useSession(); // Get session data
  const [isOpen, setIsOpen] = useState(session.user.role == 'admin' ? true : false);

  const toggleContent = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div>
      <Tabs>
        <div className="tab-container">
          <TabList>
            <Tab>Parsed Query</Tab>
            <Tab>Raw Response</Tab>
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
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <textarea
                  value={dbQuery}
                  placeholder="SQL Query Will Appear Here"
                  onChange={(e) => setDbQuery(e.target.value)}
                  rows={8}
                  style={{ width: '95%', overflowY: 'scroll', marginBottom: '10px', whiteSpace: 'pre-wrap' }}
                />&nbsp;&nbsp;
                <button onClick={handleDirectQuery} style={{ marginRight: '10px', marginBottom: '10px' }}>Run</button>
              </div>
            </TabPanel>
            <TabPanel>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <textarea
                  value={chatResult}
                  placeholder="Messages will appear here"
                  onChange={(e) => setChatResult(e.target.value)}
                  rows={8}
                  style={{ width: '95%', overflowY: 'scroll', marginBottom: '10px', whiteSpace: 'pre-wrap' }}
                />&nbsp;&nbsp;
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