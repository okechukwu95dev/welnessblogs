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

  /**
   * Updated beautify function:
   * - Removes any <img> elements.
   * - Looks for the first <div> whose text content (in any casing) includes "leave a reply" 
   *   and then removes that div and all its following sibling elements (from its parent).
   * - Logs and returns the plain text content from the cleaned-up HTML.
   */
  const beautifyHtml = (html) => {
    // Create a temporary DOM container
    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Remove all <img> elements from the HTML.
    const imgs = temp.querySelectorAll('img');
    imgs.forEach(img => img.parentNode.removeChild(img));

    // Find the first <div> that contains "leave a reply" (case-insensitive).
    const allDivs = temp.querySelectorAll('div');
    let foundDiv = null;
    for (let i = 0; i < allDivs.length; i++) {
      if (allDivs[i].textContent.toLowerCase().includes("leave a reply")) {
        foundDiv = allDivs[i];
        break;
      }
    }

    // If found, remove that div and all subsequent sibling elements of its parent.
    if (foundDiv && foundDiv.parentElement) {
      const parent = foundDiv.parentElement;
      let remove = false;
      // Convert HTMLCollection to an array to safely iterate over siblings
      const siblings = Array.from(parent.children);
      siblings.forEach(child => {
        if (child === foundDiv) {
          remove = true;
          parent.removeChild(child);
        } else if (remove) {
          parent.removeChild(child);
        }
      });
    }

    // Extract the plain text content (with images and trimmed reply area removed)
    const textContent = temp.textContent.trim();
    console.log("Beautified Text Content:", textContent);
    return textContent;
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
      // Get only the plain text content from the HTML after processing:
      const cleanedText = beautifyHtml(currentItem.html_scraped);
      setBeautifiedContent(cleanedText);
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

      // Right Panel: Contains the original HTML and, optionally, the beautified (plain text) output.
      React.createElement('div', { className: 'w-full md:w-3/4 p-4 flex flex-col' },
        // "Beautify" Button area (only shows if an item has been selected)
        React.createElement('div', { className: 'mb-4' },
          selectedUrl &&
            React.createElement('button', {
              className: 'px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600',
              onClick: handleBeautify
            }, 'Beautify')
        ),
        // Content area: displays the original HTML and if activated, the beautified plain text output.
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
            // Beautified Text Output Panel (only visible if "Beautify" has been clicked)
            showTextExtractor &&
            React.createElement('div', { className: 'md:w-1/2 p-4 bg-white rounded shadow ml-2' },
              // Here we display the plain text content.
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
