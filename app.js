const App = () => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [years, setYears] = React.useState([]);
  const [selectedYear, setSelectedYear] = React.useState(null);
  const [selectedUrl, setSelectedUrl] = React.useState(null);
  const [showTextExtractor, setShowTextExtractor] = React.useState(false);
  const [extractedBlocks, setExtractedBlocks] = React.useState([]);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [currentEditBlock, setCurrentEditBlock] = React.useState(null);
  const [changes, setChanges] = React.useState([]);

  // ... (previous fetch and basic functions remain same)

  const extractTextBlocks = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const blocks = [];
    
    const processNode = (node, depth = 0) => {
      if (node.nodeType === 3 && node.textContent.trim()) { // Text node
        blocks.push({
          id: Math.random().toString(36).substr(2, 9),
          text: node.textContent.trim(),
          path: getNodePath(node),
          depth,
          original: node.textContent
        });
      }
      node.childNodes.forEach(child => processNode(child, depth + 1));
    };

    const getNodePath = (node) => {
      const path = [];
      let current = node;
      while (current.parentNode) {
        const index = Array.from(current.parentNode.childNodes).indexOf(current);
        path.unshift(index);
        current = current.parentNode;
      }
      return path.join('-');
    };

    processNode(temp);
    setExtractedBlocks(blocks);
  };

  const handleEdit = (block) => {
    setCurrentEditBlock(block);
    setShowEditModal(true);
  };

  const saveEdit = (newText) => {
    const change = {
      timestamp: new Date().toISOString(),
      blockId: currentEditBlock.id,
      original: currentEditBlock.original,
      updated: newText
    };
    setChanges([...changes, change]);
    
    setExtractedBlocks(blocks => 
      blocks.map(b => b.id === currentEditBlock.id ? {...b, text: newText} : b)
    );
    setShowEditModal(false);
  };

  return React.createElement('div', { className: 'min-h-screen' },
    // ... (previous navigation structure)
    
    // Content Panel
    React.createElement('div', { className: 'w-full md:w-3/4 p-4 flex flex-col' },
      React.createElement('button', {
        className: 'mb-4 px-4 py-2 bg-blue-500 text-white rounded',
        onClick: () => {
          const content = data.find(item => item.url === selectedUrl);
          if (content) extractTextBlocks(content.html_scraped);
          setShowTextExtractor(true);
        }
      }, 'Extract Text Blocks'),

      // Original Content
      React.createElement('div', {
        className: 'flex-grow overflow-y-auto mb-4',
        dangerouslySetInnerHTML: { 
          __html: selectedUrl ? data.find(item => item.url === selectedUrl)?.html_scraped : ''
        }
      }),

      // Extracted Blocks
      showTextExtractor && React.createElement('div', {
        className: 'h-1/2 overflow-y-auto border rounded p-4'
      },
        extractedBlocks.map(block => 
          React.createElement('div', {
            key: block.id,
            className: 'mb-4 p-2 border rounded',
            style: {
              marginLeft: `${block.depth * 20}px`,
              borderColor: `hsl(${block.depth * 60}, 70%, 60%)`
            }
          },
            React.createElement('div', { className: 'mb-2' }, block.text),
            React.createElement('button', {
              className: 'px-2 py-1 bg-gray-200 rounded text-sm',
              onClick: () => handleEdit(block)
            }, 'Edit')
          )
        )
      )
    ),

    // Edit Modal
    showEditModal && React.createElement('div', {
      className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'
    },
      React.createElement('div', { className: 'bg-white p-4 rounded max-w-lg w-full' },
        React.createElement('textarea', {
          className: 'w-full h-32 mb-4 p-2 border rounded',
          defaultValue: currentEditBlock?.text,
          id: 'editText'
        }),
        React.createElement('div', { className: 'flex justify-end gap-2' },
          React.createElement('button', {
            className: 'px-4 py-2 bg-gray-200 rounded',
            onClick: () => setShowEditModal(false)
          }, 'Cancel'),
          React.createElement('button', {
            className: 'px-4 py-2 bg-blue-500 text-white rounded',
            onClick: () => saveEdit(document.getElementById('editText').value)
          }, 'Save')
        )
      )
    )
  );
};

ReactDOM.render(
  React.createElement(App),
  document.getElementById('root')
);
