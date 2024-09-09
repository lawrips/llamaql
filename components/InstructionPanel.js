import React, { useState } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

const InstructionPanel = ({
  dbQuery,
  setDbQuery,
  queryInstructions,
  setQueryInstructions,
  dataInstructions,
  setDataInstructions,
  dataSchema,
  setDataSchema,
  instructSubs,
  checkedItems,
  handleInstructSubChange,
  handleDirectQuery
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const toggleContent = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div style={{ marginTop: '20px' }}>
      <Tabs>
        <div className="tab-container">
          <TabList>
            <Tab>Data Query</Tab>
            <Tab>Query Instructions</Tab>
            <Tab>Data Instructions</Tab>
            <Tab>Data Schema</Tab>
          </TabList>
          <div className="collapsible" onClick={toggleContent}>
            {isOpen ? '⮝' : '⮟'}
          </div>
        </div>

        {isOpen && (
          <div className="content">
            <TabPanel>
              <div style={{ marginTop: '20px', display: 'flex', alignItems: 'flex-end' }}>
                <textarea
                  value={dbQuery}
                  placeholder="Data Query"
                  onChange={(e) => setDbQuery(e.target.value)}
                  rows={10}
                  style={{ width: '95%', overflowY: 'scroll', marginBottom: '10px', whiteSpace: 'pre-wrap'  }}
                />&nbsp;&nbsp;
                <button onClick={handleDirectQuery} style={{ marginRight: '10px', marginBottom: '10px' }}>&gt;</button>
              </div>
            </TabPanel>
            <TabPanel>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <textarea
                  value={queryInstructions}
                  placeholder="Query Instructions"
                  onChange={(e) => setQueryInstructions(e.target.value)}
                  rows={10}
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
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <textarea
                  value={dataInstructions}
                  placeholder="Data Instructions"
                  onChange={(e) => setDataInstructions(e.target.value)}
                  rows={10}
                  style={{ width: '90%', overflowY: 'scroll', marginBottom: '10px' }}
                />&nbsp;
              </div>
            </TabPanel>
            <TabPanel>
              <textarea
                value={dataSchema}
                placeholder="Data Schema"
                onChange={(e) => setDataSchema(e.target.value)}
                rows={10}
                style={{ width: '90%', overflowY: 'scroll', marginBottom: '10px' }}
              />&nbsp;
            </TabPanel>
          </div>
        )}
      </Tabs>
    </div>
  );
};

export default InstructionPanel;