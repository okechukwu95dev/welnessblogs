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

  const getDummyHtml = () => `
    <div class="entry-content">
      <h1>The Benefits of Meditation</h1>
      <p>Discover why meditation has become essential for modern life.</p>
      <img src="meditation.jpg" alt="Person meditating"/>
      <ul>
        <li>Reduced stress and anxiety</li>
        <li>Better sleep quality</li>
        <li>Increased focus and concentration</li>
      </ul>
    </div>
  `;

  const beautifyHtml = (html) => {
    const htmlToProcess = html || getDummyHtml();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlToProcess, 'text/html');
    doc.querySelectorAll('img').forEach(img => img.remove());
    return doc.body.textContent.trim();
  };

  const handleUrlSelect = (item) => {
    setSelectedUrl(item.url);
    setShowTextExtractor(false);
    setBeautifiedContent('');
  };

  const handleBeautify = () => {
    if (dummyMode) {
      const cleanedText = beautifyHtml(null);
      setBeautifiedContent(cleanedText);
      setShowTextExtractor(true);
      return;
    }
    const currentItem = data.find(item => item.url === selectedUrl);
    if (currentItem?.html_scraped) {
      const cleanedText = beautifyHtml(currentItem.html_scraped);
      setBeautifiedContent(cleanedText);
      setShowTextExtractor(true);
    }
  };

  const handleCopyHtml = () => {
    const currentItem = data.find(item => item.url === selectedUrl);
    if (currentItem?.html_scraped) {
      const htmlLines = currentItem.html_scraped.split('\n').slice(0, 10).join('\n');
      setBeautifiedContent(htmlLines);
      setShowTextExtractor(true);
    } else if (dummyMode) {
      const htmlLines = getDummyHtml().split('\n').slice(0, 10).join('\n');
      setBeautifiedContent(htmlLines);
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

  const renderButtons = () => selectedUrl && React.createElement('div', { className: 'mb-4 flex space-x-4' }, [
    React.createElement('button', {
      key: 'beautify',
      className: 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600',
      onClick: handleBeautify
    }, 'Beautify'),
    React.createElement('button', {
      key: 'copy',
      className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600',
      onClick: handleCopyHtml
    }, 'Copy First 10 Lines')
  ]);

  const renderContent = () => showTextExtractor && React.createElement('div', { className: 'p-4 bg-white rounded shadow' },
    React.createElement('pre', { className: 'whitespace-pre-wrap' }, beautifiedContent)
  );

  return React.createElement('div', { className: 'min-h-screen' },
    React.createElement('div', { className: 'flex flex-col md:flex-row h-screen' },
      React.createElement('div', { className: 'w-full md:w-1/4 p-4 border-r overflow-y-auto bg-gray-50' },
        React.createElement('h1', { className: 'text-2xl mb-4 font-bold' }, 'Wellness Blogs'),
        years.map(renderYear)
      ),
      React.createElement('div', { className: 'w-full md:w-3/4 p-4 flex flex-col' },
        renderButtons(),
        React.createElement('div', { className: 'flex-grow overflow-y-auto' },
          renderContent()
        )
      )
    )
  );
};

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  ReactDOM.render(
    React.createElement(App),
    document.getElementById('root')
  );
});