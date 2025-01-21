const App = () => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [years, setYears] = React.useState([]);
  const [selectedYear, setSelectedYear] = React.useState(null);
  const [selectedUrl, setSelectedUrl] = React.useState(null);
  const [showTextExtractor, setShowTextExtractor] = React.useState(false);
  const [processedHtml, setProcessedHtml] = React.useState('');
  const [extractedText, setExtractedText] = React.useState('');

  React.useEffect(() => {
    const csvUrl = 'https://raw.githubusercontent.com/okechukwu95dev/welnessblogs/main/scraped_html_non_media_unique_processed.csv';
    fetch(csvUrl)
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        const processedData = result.data;
        setYears([...new Set(processedData.map(item => item.year))].sort());
        setData(processedData);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const wrapAllImages = (htmlString) => {
    const temp = document.createElement('div');
    temp.innerHTML = htmlString;
    const elements = temp.querySelectorAll('img,[role="img"],[role="image"],[role="icon"]');
    Array.from(elements).forEach(el => {
      const alt = el.getAttribute('alt') || '';
      const src = el.getAttribute('src') || '';
      const wrapper = document.createElement('div');
      wrapper.className = 'image-block';
      wrapper.style.border = '1px dashed #999';
      wrapper.style.padding = '4px';
      wrapper.style.margin = '4px 0';
      const label = document.createElement('div');
      label.style.fontSize = '0.85em';
      label.style.color = '#666';
      label.style.marginBottom = '3px';
      label.innerHTML = `<strong>Image</strong> [alt="${alt}" src="${src.length > 50 ? src.slice(0, 50) + '...' : src}"]`;
      wrapper.appendChild(label);
      wrapper.appendChild(el.cloneNode(true));
      el.parentNode.replaceChild(wrapper, el);
    });
    return temp.innerHTML;
  };

  const extractText = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    const text = temp.textContent || temp.innerText;
    return text.replace(/\s+/g, ' ').trim();
  };

  const handleUrlSelect = (item) => {
    setSelectedUrl(item.url);
    setProcessedHtml(wrapAllImages(item.html_scraped || ''));
  };

  const handleExtractText = () => {
    const content = data.find(item => item.url === selectedUrl);
    if (content) {
      setExtractedText(extractText(content.html_scraped));
      setShowTextExtractor(true);
    }
  };

  if (loading) return React.createElement('div', null, 'Loading...');

  return React.createElement('div', { className: 'min-h-screen' },
    React.createElement('div', { className: 'flex flex-col md:flex-row h-screen' },
      // Left Panel - Navigation
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
                    .map(item => 
                      React.createElement('button', {
                        key: item.url,
                        className: 'w-full text-left p-2 text-sm bg-white rounded hover:bg-blue-50 ' + 
                                 (selectedUrl === item.url ? 'bg-blue-100' : ''),
                        onClick: () => handleUrlSelect(item)
                      },
                        React.createElement('div', { className: 'font-medium' }, item.date),
                        React.createElement('div', { className: 'text-xs text-gray-600 truncate' }, item.url)
                      )
                    )
              )
          )
        )
      ),
      
      // Right Panel - Content and Extractor
      React.createElement('div', { className: 'w-full md:w-3/4 p-4 flex flex-col' },
        // Actions
        React.createElement('div', { className: 'mb-4 flex gap-2' },
          React.createElement('button', {
            className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600',
            onClick: handleExtractText
          }, 'Extract Text'),
          React.createElement('button', {
            className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600',
            onClick: () => setShowTextExtractor(!showTextExtractor)
          }, showTextExtractor ? 'Hide Extracted Text' : 'Show Extracted Text')
        ),
        
        // Content Area
        React.createElement('div', { 
          className: 'flex-grow overflow-y-auto mb-4 ' + (showTextExtractor ? 'h-2/3' : 'h-full')
        },
          selectedUrl && 
            React.createElement('div', {
              className: 'p-4 bg-white rounded shadow',
              dangerouslySetInnerHTML: { html: processedHtml }
            })
        ),
        
        // Text Extractor Panel
        showTextExtractor && React.createElement('div', {
          className: 'h-1/3 p-4 bg-gray-100 rounded shadow overflow-y-auto'
        },
          React.createElement('h3', { className: 'font-bold mb-2' }, 'Extracted Text'),
          React.createElement('div', { className: 'whitespace-pre-wrap border p-2 bg-white rounded' },
            extractedText
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
