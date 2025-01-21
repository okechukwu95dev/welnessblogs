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

  if (loading) return (<div>Loading...</div>);

  return (
    <div>
      <div>
        {years.map((year) => (
          <div key={year}>
            <button onClick={() => setSelectedYear(year)}>{year}</button>
            {selectedYear === year &&
              data
                .filter((item) => item.year === year)
                .map((item) => (
                  <button key={item.url} onClick={() => handleUrlSelect(item)}>
                    {item.url}
                  </button>
                ))}
          </div>
        ))}
      </div>
      <div>
        {selectedUrl && (
          <>
            <button onClick={handleBeautify}>Beautifymaxy</button>
            <button onClick={handleCopyHtml}>Copy First 10 Lines</button>
          </>
        )}
        {showTextExtractor && <pre>{beautifiedContent}</pre>}
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
