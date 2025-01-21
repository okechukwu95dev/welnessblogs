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
        const result = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        const processedData = result.data;
        const uniqueYears = [...new Set(processedData.map(item => item.year))].sort();
        setYears(uniqueYears);
        setData(processedData);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const fixEncodingIssues = (htmlString) => {
    const replacements = [
      { find: /â/g, replace: "'" },
      { find: /â/g, replace: """ },
      { find: /â/g, replace: """ },
      { find: /â/g, replace: "–" },
      { find: /Â/g, replace: "" },
    ];
  
    let out = htmlString;
    replacements.forEach((r) => {
      out = out.replace(r.find, r.replace);
    });
    return out;
  };

  const beautifyHtml = (html) => {
    if (!html) {
      html = `
        <div class="entry-content">
          <h1>The Benefits of Meditation</h1>
          <p>Discover why meditation has become essential for modern life â€™ especially in these stressful times.</p>
          <img src="meditation.jpg" alt="Person meditating"/>
          <h2>Key Benefits:</h2>
          <ul>
            <li>Reduced stress and anxiety</li>
            <li>Better sleep quality</li>
            <li>Increased focus and concentration</li>
          </ul>
          <p>Start with just 5 minutes a day â€™ thatâ€™s all you need to begin your journey.</p>
          <div class="comment-section">
            <div>Leave a reply</div>
            <form>Comment form here</form>
          </div>
        </div>
      `;
    }

    const parser = new DOMParser();
    const fixedHtml = fixEncodingIssues(html);
    const doc = parser.parseFromString(fixedHtml, 'text/html');
    
    doc.querySelectorAll('img').forEach(img => img.remove());
    
    const allDivs = doc.querySelectorAll('div');
    for (const div of allDivs) {
      if (div.textContent.toLowerCase().includes('leave a reply')) {
        let current = div;
        while (current) {
          const next = current.nextSibling;
          current.remove();
          current = next;
        }
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
    } else {
      const cleanedText = beautifyHtml();  // Use dummy content
      setBeautifiedContent(cleanedText);
      setShowTextExtractor(true);
    }
  };

  if (loading) return React.createElement('div', null, 'Loading...');

  return React.createElement('div', { className: 'min-h-screen' },
    React.createElement('div', { className: 'flex flex-col md:flex-row h-screen' },
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
      React.createElement('div', { className: 'w-full md:w-3/4 p-4 flex flex-col' },
        React.createElement('div', { className: 'mb-4' },
          selectedUrl &&
            React.createElement('button', {
              className: 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600',
              onClick: handleBeautify
            }, 'Beautify')
        ),
        React.createElement('div', { className: 'flex-grow overflow-y-auto' },
          selectedUrl && data.find(item => item.url === selectedUrl)?.html_scraped &&
          React.createElement('div', { className: showTextExtractor ? 'md:flex' : '' },
            React.createElement('div', { className: showTextExtractor ? 'md:w-1/2 p-4 bg-white rounded shadow mr-2' : 'p-4 bg-white rounded shadow' },
              React.createElement('div', {
                dangerouslySetInnerHTML: {
                  __html: data.find(item => item.url === selectedUrl).html_scraped
                }
              })
            ),
            showTextExtractor &&
            React.createElement('div', { className: 'md:w-1/2 p-4 bg-white rounded shadow ml-2' },
              React.createElement('pre', null, beautifiedContent)
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