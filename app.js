const App = () => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [years, setYears] = React.useState([]);
  const [selectedYear, setSelectedYear] = React.useState(null);
  const [selectedUrl, setSelectedUrl] = React.useState(null);
  const [showTextExtractor, setShowTextExtractor] = React.useState(false);
  const [beautifiedContent, setBeautifiedContent] = React.useState('');

  React.useEffect(() => {
    const csvUrl = 'https://raw.githubusercontent.com/okechukwu95dev/welnessblogs/main/scraped_html_non_media_unique_processed.csv';
    fetch(csvUrl)
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true
        });
        if (result.data && result.data.length) {
          const processedData = result.data.map(item => ({
            ...item,
            uniqueId: item.year + '-' + item.date + '-' + Math.random().toString(36).substr(2, 9)
          }));
          const uniqueYears = [...new Set(processedData.map(item => item.year))].sort();
          setYears(uniqueYears);
          setData(processedData);
        }
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const beautifyHtml = (html) => {
    console.log('Input HTML:', html?.substring(0, 100));
    console.log('Full HTML length:', html?.length);

    if (!html) {
      console.log('No HTML provided');
      return '';
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    console.log('Parsed DOM structure:', doc.body.children.length, 'root elements');
    
    // Remove images
    const images = doc.querySelectorAll('img');
    console.log('Removing', images.length, 'images');
    images.forEach(img => img.remove());
    
    // Find and remove 'Leave a Reply' and everything after
    let removed = false;
    const allElements = Array.from(doc.body.getElementsByTagName('*'));
    console.log('Total elements to check:', allElements.length);
    
    allElements.forEach(element => {
      if (!removed && element.textContent.toLowerCase().includes('leave a reply')) {
        console.log('Found Leave a Reply section:', element.textContent.substring(0, 50));
        let current = element;
        while (current) {
          const next = current.nextSibling;
          current.remove();
          current = next;
        }
        removed = true;
      }
    });
    
    const cleaned = doc.body.textContent.trim();
    console.log('Final cleaned text length:', cleaned.length);
    console.log('First 100 chars of cleaned text:', cleaned.substring(0, 100));
    return cleaned;
  };

  const handleUrlSelect = (item) => {
    console.log('Selected item:', item.url, item.date);
    setSelectedUrl(item.url);
    setShowTextExtractor(false);
    setBeautifiedContent('');
  };

  const handleBeautify = () => {
    const currentItem = data.find(item => item.url === selectedUrl);
    console.log('Processing item:', currentItem?.url, currentItem?.date);
    if (currentItem?.html_scraped) {
      console.log('Starting beautification...');
      const cleanedText = beautifyHtml(currentItem.html_scraped);
      console.log('Beautification complete');
      setBeautifiedContent(cleanedText);
      setShowTextExtractor(true);
    }
  };

  if (loading) return React.createElement('div', null, 'Loading...');

  return React.createElement('div', { className: 'min-h-screen' },
    React.createElement('div', { className: 'flex flex-col md:flex-row h-screen' },
      // Left Navigation Panel
      React.createElement('div', { className: 'w-full md:w-1/4 p-4 border-r overflow-y-auto bg-gray-50' },
        React.createElement('h1', { className: 'text-2xl mb-4 font-bold' }, 'Wellness Blogs'),
        years.map(year =>
          React.createElement('div', {           key: 'year-' + year, className: 'mb-2' },
            React.createElement('button', {
              className: 'w-full text-left p-2 bg-white rounded shadow hover:bg-gray-100 flex justify-between items-center',
              onClick: () => setSelectedYear(selectedYear === year ? null : year)
            },
              React.createElement('span', null, year),
              React.createElement('span', null, selectedYear === year ? '▼' : '▶')
            ),
            selectedYear === year &&
              React.createElement('div', { className: 'ml-4 mt-2 space-y-2' },
                data
                  .filter(item => item.year === year)
                  .map(item =>
                    React.createElement('button', {
                      key: item.uniqueId,
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
      // Right Content Panel
      React.createElement('div', { className: 'w-full md:w-3/4 p-4 flex flex-col' },
        React.createElement('div', { className: 'mb-4' },
          selectedUrl && React.createElement('button', {
            className: 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600',
            onClick: handleBeautify
          }, 'Beautify')
        ),
        React.createElement('div', { className: 'flex-grow overflow-y-auto' },
          selectedUrl && data.find(item => item.url === selectedUrl)?.html_scraped &&
          React.createElement('div', { className: showTextExtractor ? 'md:flex space-x-4' : '' },
            // Original HTML panel
            React.createElement('div', {
              key: 'original',
              className: showTextExtractor ? 'md:w-1/2 p-4 bg-white rounded shadow' : 'p-4 bg-white rounded shadow'
            },
              React.createElement('div', {
                dangerouslySetInnerHTML: {
                  __html: data.find(item => item.url === selectedUrl).html_scraped
                }
              })
            ),
            // Beautified content panel
            showTextExtractor && beautifiedContent &&
            React.createElement('div', {
              key: 'beautified',
              className: 'md:w-1/2 p-4 bg-white rounded shadow'
            },
              React.createElement('div', { className: 'space-y-4' },
                beautifiedContent.split('\n\n').map((section, idx) =>
                  React.createElement('div', {
                    key: 'section-' + idx,
                    className: 'p-3 border-b border-gray-200 last:border-b-0'
                  }, section)
                )
              )
            )
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