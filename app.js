const App = () => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [years, setYears] = React.useState([]);
  const [selectedYear, setSelectedYear] = React.useState(null);
  const [selectedUrl, setSelectedUrl] = React.useState(null);
  const [showTextExtractor, setShowTextExtractor] = React.useState(false);
  const [extractedBlocks, setExtractedBlocks] = React.useState([]);

  React.useEffect(() => {
    const csvUrl = 'https://raw.githubusercontent.com/okechukwu95dev/welnessblogs/main/scraped_html_non_media_unique_processed.csv';
    fetch(csvUrl)
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        const uniqueData = result.data.reduce((acc, curr) => {
          const key = \`\${curr.url}_\${curr.date}\`;
          if (!acc[key]) acc[key] = curr;
          return acc;
        }, {});
        const processedData = Object.values(uniqueData);
        setYears([...new Set(processedData.map(item => item.year))].sort());
        setData(processedData);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const extractTextBlocks = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const blocks = [];
    const colors = ['#FFE4E1', '#E6E6FA', '#F0FFF0', '#FFF0F5', '#F5F5DC'];
    let colorIndex = 0;

    const processNode = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE && node.textContent.trim()) {
        const textContent = node.textContent.trim();
        if (textContent) {
          blocks.push({
            id: \`block_\${Math.random()}\`,
            text: textContent,
            color: colors[colorIndex % colors.length]
          });
          colorIndex++;
        }
      }
      node.childNodes.forEach(child => processNode(child));
    };

    processNode(temp);
    setExtractedBlocks(blocks);
    setShowTextExtractor(true);
  };

  if (loading) return React.createElement('div', null, 'Loading...');

  return React.createElement('div', { className: 'min-h-screen' },
    React.createElement('div', { className: 'flex flex-col md:flex-row h-screen' },
      // Left Panel
      React.createElement('div', { className: 'w-full md:w-1/4 p-4 border-r overflow-y-auto bg-gray-50' },
        React.createElement('h1', { className: 'text-2xl mb-4 font-bold' }, 'Wellness Blogs'),
        years.map(year => 
          React.createElement('div', { key: year, className: 'mb-2' },
            React.createElement('button', {
              className: 'w-full text-left p-2 bg-white rounded shadow hover:bg-gray-100 flex justify-between items-center',
              onClick: () => setSelectedYear(selectedYear === year ? null : year)
            },
              React.createElement('span', null, year),
              React.createElement('span', null, selectedYear === year ? '▼' : '▶')
            ),
            selectedYear === year && 
              React.createElement('div', { className: 'ml-4 mt-2 space-y-2' },
                data.filter(item => item.year === year)
                    .map((item, index) => 
                      React.createElement('button', {
                        key: \`\${item.url}_\${index}\`,
                        className: 'w-full text-left p-2 text-sm bg-white rounded hover:bg-blue-50 ' + 
                                 (selectedUrl === item.url ? 'bg-blue-100' : ''),
                        onClick: () => {
                          setSelectedUrl(item.url);
                          setShowTextExtractor(false);
                        }
                      },
                        React.createElement('div', { className: 'font-medium' }, item.date),
                        React.createElement('div', { className: 'text-xs text-gray-600 truncate' }, item.url)
                      )
                    )
              )
          )
        )
      ),
      
      // Right Panel
      React.createElement('div', { className: 'w-full md:w-3/4 p-4 flex flex-col' },
        // Extract Text Button
        React.createElement('button', {
          className: 'mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600',
          onClick: () => {
            const content = data.find(item => item.url === selectedUrl);
            if (content) extractTextBlocks(content.html_scraped);
          }
        }, 'Extract Text Blocks'),

        // Content Display
        !showTextExtractor && selectedUrl && 
          React.createElement('div', {
            className: 'flex-grow overflow-y-auto',
            dangerouslySetInnerHTML: { 
              __html: data.find(item => item.url === selectedUrl)?.html_scraped 
            }
          }),

        // Extracted Blocks Display
        showTextExtractor && 
          React.createElement('div', { className: 'flex-grow overflow-y-auto' },
            extractedBlocks.map(block => 
              React.createElement('div', {
                key: block.id,
                className: 'p-4 mb-4 rounded shadow',
                style: { backgroundColor: block.color }
              }, block.text)
            )
          )
      )
    )
  );
};

ReactDOM.render(
  React.createElement(App),
  document.getElementById('root')
);
