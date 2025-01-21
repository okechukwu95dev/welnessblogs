const App = () => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [years, setYears] = React.useState([]);
  const [selectedYear, setSelectedYear] = React.useState(null);
  const [selectedUrl, setSelectedUrl] = React.useState(null);
  const [showTextExtractor, setShowTextExtractor] = React.useState(false);
  const [beautifiedContent, setBeautifiedContent] = React.useState('');

  // Fetch CSV data on load
  React.useEffect(() => {
    const csvUrl =
      'https://raw.githubusercontent.com/okechukwu95dev/welnessblogs/main/scraped_html_non_media_unique_processed.csv';

    fetch(csvUrl)
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
        });
        const processedData = result.data;
        const uniqueYears = [...new Set(processedData.map(item => item.year))].sort();
        setYears(uniqueYears);
        setData(processedData);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  // This function simply removes the content that comes after the "Posted in Uncategorized." text.
  // It creates a temporary DOM container, searches for a text node that includes the forbidden text,
  // and then removes that node and all of its following siblings.
  const beautifyHtml = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Recursive function that checks each child node.
    const removeAfterForbiddenText = (node) => {
      let child = node.firstChild;
      while (child) {
        // If a text node contains the forbidden text, remove it and all subsequent siblings.
        if (child.nodeType === Node.TEXT_NODE && child.textContent.includes("Posted in Uncategorized.")) {
          while (child.nextSibling) {
            node.removeChild(child.nextSibling);
          }
          node.removeChild(child);
          return true;
        }
        // If it's an element node, check its inner text.
        else if (child.nodeType === Node.ELEMENT_NODE) {
          if (child.innerText && child.innerText.includes("Posted in Uncategorized.")) {
            // Remove this element and all siblings after it.
            let next = child.nextSibling;
            while (next) {
              node.removeChild(next);
              next = child.nextSibling;
            }
            node.removeChild(child);
            return true;
          } else {
            // Recurse inside this element.
            if (removeAfterForbiddenText(child)) return true;
          }
        }
        child = child.nextSibling;
      }
      return false;
    };

    removeAfterForbiddenText(temp);
    return temp.innerHTML;
  };

  // Called when an item is selected from the left navigation.
  const handleUrlSelect = (item) => {
    setSelectedUrl(item.url);
    // Reset beautified view when selecting a new item.
    setShowTextExtractor(false);
    setBeautifiedContent('');
  };

  // Called when the "Beautify" button is clicked.
  const handleBeautify = () => {
    const currentItem = data.find(item => item.url === selectedUrl);
    if (currentItem && currentItem.html_scraped) {
      const cleanedHtml = beautifyHtml(currentItem.html_scraped);
      setBeautifiedContent(cleanedHtml);
      setShowTextExtractor(true);
    }
  };

  if (loading) return React.createElement('div', null, 'Loading...');

  return React.createElement('div', { className: 'min-h-screen' },
    // Main container: Left panel + Right panel
    React.createElement('div', { className: 'flex flex-col md:flex-row h-screen' },
      
      // Left Navigation Panel
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

      // Right Panel: Contains the original HTML and, optionally, the beautified content.
      React.createElement('div', { className: 'w-full md:w-3/4 p-4 flex flex-col' },
        // "Beautify" Button area (shows only when an item is selected).
        React.createElement('div', { className: 'mb-4' },
          selectedUrl &&
            React.createElement('button', {
              className: 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600',
              onClick: handleBeautify
            }, 'Beautify')
        ),
        // Content area: displays the original HTML and, if activated, the beautified (cleaned) version
        React.createElement('div', { className: 'flex-grow overflow-y-auto' },
          selectedUrl && data.find(item => item.url === selectedUrl)?.html_scraped &&
          React.createElement('div', { className: showTextExtractor ? 'md:flex' : '' },
            // Original HTML Content Panel
            React.createElement('div', { className: showTextExtractor ? 'md:w-1/2 p-4 bg-white rounded shadow mr-2' : 'p-4 bg-white rounded shadow' },
              React.createElement('div', {
                dangerouslySetInnerHTML: {
                  __html: data.find(item => item.url === selectedUrl).html_scraped
                }
              })
            ),
            // Beautified Content Panel (only visible if "Beautify" has been clicked)
            showTextExtractor &&
            React.createElement('div', { className: 'md:w-1/2 p-4 bg-white rounded shadow ml-2' },
              React.createElement('div', {
                dangerouslySetInnerHTML: {
                  __html: beautifiedContent
                }
              })
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
