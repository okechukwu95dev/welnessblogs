// Force clear cache on refresh
if (window.performance && window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD) {
  window.location.reload(true);
}

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
    const csvUrl =
      'https://raw.githubusercontent.com/okechukwu95dev/welnessblogs/main/scraped_html_non_media_unique_processed.csv';
    fetch(csvUrl)
      .then((response) => response.text())
      .then((csvText) => {
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          error: (error) => {
            console.error('CSV parsing error:', error);
            setDummyMode(true);
          },
        });
        if (result.data && result.data.length) {
          const processedData = result.data;
          const uniqueYears = [...new Set(processedData.map((item) => item.year))].sort();
          setYears(uniqueYears);
          setData(processedData);
        } else {
          setDummyMode(true);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error('Fetch error:', error);
        setDummyMode(true);
        setLoading(false);
      });
  }, []);

  const fixEncodingIssues = (htmlString) => {
    const replacements = [
      // Add replacements for encoding issues here
    ];
    let out = htmlString;
    replacements.forEach((r) => {
      out = out.replace(r.find, r.replace);
    });
    return out;
  };

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
    const fixedHtml = fixEncodingIssues(htmlToProcess);
    const doc = parser.parseFromString(fixedHtml, 'text/html');
    doc.querySelectorAll('img').forEach((img) => img.remove());
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
    const currentItem = data.find((item) => item.url === selectedUrl);
    if (currentItem?.html_scraped) {
      const cleanedText = beautifyHtml(currentItem.html_scraped);
      setBeautifiedContent(cleanedText);
      setShowTextExtractor(true);
    }
  };

  const handleCopyHtml = () => {
    const currentItem = data.find((item) => item.url === selectedUrl);
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen">
      <div className="flex flex-col md:flex-row h-screen">
        {/* Left Panel */}
        <div className="w-full md:w-1/4 p-4 border-r overflow-y-auto bg-gray-50">
          <h1 className="text-2xl mb-4 font-bold">Wellness Blogs</h1>
          {years.map((year) => (
            <div key={year} className="mb-2">
              <button
                className="w-full text-left p-2 bg-white rounded shadow hover:bg-gray-100 flex justify-between items-center"
                onClick={() => setSelectedYear(selectedYear === year ? null : year)}
              >
                <span>{year}</span>
                <span>{selectedYear === year ? '▼' : '▶'}</span>
              </button>
              {selectedYear === year && (
                <div className="ml-4 mt-2 space-y-2">
                  {data
                    .filter((item) => item.year === year)
                    .map((item) => (
                      <button
                        key={item.url}
                        className={
                          'w-full text-left p-2 text-sm bg-white rounded hover:bg-blue-50 ' +
                          (selectedUrl === item.url ? 'bg-blue-100' : '')
                        }
                        onClick={() => handleUrlSelect(item)}
                      >
                        <div className="font-medium">{item.date}</div>
                        <div className="text-xs text-gray-600 truncate">{item.url}</div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <div className="w-full md:w-3/4 p-4 flex flex-col">
          {/* Buttons */}
          <div className="mb-4 flex space-x-4">
            {selectedUrl && (
              <>
                <button
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  onClick={handleBeautify}
                >
                  Beautify
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleCopyHtml}
                >
                  Copy First 10 Lines
                </button>
              </>
            )}
          </div>

          {/* Beautified or Copied Content */}
          <div className="flex-grow overflow-y-auto">
            {showTextExtractor && (
              <div className="p-4 bg-white rounded shadow">
                <pre className="whitespace-pre-wrap">{beautifiedContent}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
