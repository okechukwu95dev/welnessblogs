const App = () => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [years, setYears] = React.useState([]);
  const [selectedYear, setSelectedYear] = React.useState(null);
  const [selectedUrl, setSelectedUrl] = React.useState(null);

  React.useEffect(() => {
    const csvUrl = 'https://raw.githubusercontent.com/okechukwu95dev/welnessblogs/main/scraped_html_non_media_unique_processed_2.csv';
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
            uniqueId: item.complete_scrape_url
          }));
          const uniqueYears = [...new Set(processedData.map(item => item.year))].sort();
          setYears(uniqueYears);
          setData(processedData);
        }
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  const handleUrlSelect = (item) => {
    console.log('Selected item:', {
      url: item.url,
      date: item.date,
      key: item.uniqueId,
      complete_scrape_url: item.complete_scrape_url
    });
    setSelectedUrl(item.uniqueId);
  };

  const handleClose = () => {
    setSelectedUrl(null);
  };

  if (loading) return React.createElement('div', null, 'Loading...');

  return React.createElement('div', { className: 'min-h-screen max-w-[2000px] mx-auto' },
    React.createElement('div', { className: 'flex flex-col md:flex-row h-screen' },
      // Left Navigation Panel
      React.createElement('div', { className: 'w-full md:w-1/4 lg:w-1/5 p-4 border-r overflow-y-auto bg-gray-50' },
        React.createElement('h1', { className: 'text-xl md:text-2xl mb-4 font-bold' }, 'Wellness Blogs'),
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
                data
                  .filter(item => item.year === year)
                  .map(item =>
                    React.createElement('button', {
                      key: item.uniqueId,
                      className: 'w-full text-left p-2 text-sm bg-white rounded hover:bg-blue-50 ' +
                        (selectedUrl === item.uniqueId ? 'bg-blue-100' : ''),
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
      React.createElement('div', { className: 'w-full md:w-3/4 lg:w-4/5 p-4 flex flex-col' },
        selectedUrl && React.createElement('div', { className: 'flex justify-end mb-4' },
          React.createElement('button', {
            onClick: handleClose,
            className: 'px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm'
          }, '✕ Close')
        ),
        React.createElement('div', { 
          className: 'flex-grow overflow-y-auto',
          style: { fontSize: 'clamp(14px, 1vw, 16px)' }
        },
          selectedUrl && data.find(item => item.uniqueId === selectedUrl)?.html_scraped &&
          React.createElement('div', { className: 'p-4 bg-white rounded shadow' },
            React.createElement('div', {
              className: 'prose max-w-none',
              dangerouslySetInnerHTML: {
                __html: data.find(item => item.uniqueId === selectedUrl).html_scraped
              }
            })
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