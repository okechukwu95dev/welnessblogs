const App = () => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [years, setYears] = React.useState([]);
  const [selectedYear, setSelectedYear] = React.useState(null);
  const [selectedUrl, setSelectedUrl] = React.useState(null);
  const [showTextExtractor, setShowTextExtractor] = React.useState(false);
  const [beautifiedContent, setBeautifiedContent] = React.useState('');
  const [dummyMode, setDummyMode] = React.useState(false);

  React.useEffect(() => {
    const csvUrl = 'https://raw.githubusercontent.com/okechukwu95dev/welnessblogs/main/scraped_html_non_media_unique_processed.csv';
    fetch(csvUrl)
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          error: (error) => {
            console.error('CSV parsing error:', error);
            setDummyMode(true);
          }
        });
        if (result.data && result.data.length) {
          const processedData = result.data;
          const uniqueYears = [...new Set(processedData.map(item => item.year))].sort();
          setYears(uniqueYears);
          setData(processedData);
        } else {
          setDummyMode(true);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Fetch error:', error);
        setDummyMode(true);
        setLoading(false);
      });
  }, []);

  const beautifyHtml = (html) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || '', 'text/html');
    
    // Remove images first
    doc.querySelectorAll('img').forEach(img => img.remove());
    
    // Find 'Leave a Reply' section (case-insensitive) and remove it plus everything after
    const allElements = doc.body.getElementsByTagName('*');
    for (let i = 0; i < allElements.length; i++) {
      const element = allElements[i];
      if (element.textContent.toLowerCase().includes('leave a reply')) {
        // Remove this element and all following siblings
        while (element.nextSibling) {
          element.nextSibling.remove();
        }
        element.remove();
        break;
      }
    }
    
    return doc.body.textContent.trim();
  };

  const handleUrlSelect = (item) => {
    setSelectedUrl(item.url);
    setShowTextExtractor(false);
    setBeautifiedContent('');
  };

  const handleBeautify = () => {
    const currentItem = data.find(item => item.url === selectedUrl);
    if (currentItem?.html_scraped) {
      const cleanedText = beautifyHtml(currentItem.html_scraped);
      setBeautifiedContent(cleanedText);
      setShowTextExtractor(true);
    }
  };

  if (loading) return React.createElement('div', null, 'Loading...');

  const renderYear = (year) => React.createElement('div', { key: year, className: 'mb-2' },
    React.createElement('button', {
      className: 'w-full text-left p-2 bg-white rounded shadow hover:bg-gray-100 flex justify-between items-center',
      onClick: () => setSelectedYear(selectedYear === year ? null : year)
    },
      React.createElement('span', null, year),
      React.createElement('span', null, selectedYear === year ? '▼' : '▶')
    ),
    selectedYear === year && React.createElement('div', { className: 'ml-4 mt-2 space-y-2' },
      data.filter(item => item.year === year)
        .map(item => React.createElement('button', {
          key: `${year}-${item.url}`,
          className: 'w-full text-left p-2 text-sm bg-white rounded hover:bg-blue-50 ' +
            (selectedUrl === item.url ? 'bg-blue-100' : ''),
          onClick: () => handleUrlSelect(item)
        },
          React.createElement('div', { className: 'font-medium' }, item.date),
          React.createElement('div', { className: 'text-xs text-gray-600 truncate' }, item.url)
        ))
    )
  );

  const renderContent = () => {
    if (!showTextExtractor) return null;

    const currentItem = data.find(item => item.url === selectedUrl);
    return React.createElement('div', { className: 'md:flex space-x-4' }, [
      React.createElement('div', { 
        key: 'original',
        className: 'md:w-1/2 p-4 bg-white rounded shadow'
      },
        React.createElement('div', {
          dangerouslySetInnerHTML: {
            __html: currentItem?.html_scraped || ''
          }
        })
      ),
      React.createElement('div', { 
        key: 'beautified',
        className: 'md:w-1/2 p-4 bg-white rounded shadow border border-gray-200' 
      },
        React.createElement('div', { className: 'space-y-4' },
          beautifiedContent.split('\n\n').map((section, idx) => 
            React.createElement('div', {
              key: idx,
              className: 'p-3 border-b border-gray-200 last:border-b-0'
            }, section)
          )
        )
      )
    ]);
  };

  return React.createElement('div', { className: 'min-h-screen' },
    React.createElement('div', { className: 'flex flex-col md:flex-row h-screen' },
      React.createElement('div', { className: 'w-full md:w-1/4 p-4 border-r overflow-y-auto bg-gray-50' },
        React.createElement('h1', { className: 'text-2xl mb-4 font-bold' }, 'Wellness Blogs'),
        years.map(renderYear)
      ),
      React.createElement('div', { className: 'w-full md:w-3/4 p-4 flex flex-col' },
        React.createElement('div', { className: 'mb-4' },
          selectedUrl && React.createElement('button', {
            className: 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600',
            onClick: handleBeautify
          }, 'Beautify')
        ),
        React.createElement('div', { className: 'flex-grow overflow-y-auto' },
          renderContent()
        )
      )
    )
  );
};

ReactDOM.render(
  React.createElement(App),
  document.getElementById('root')
);