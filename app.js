const App = () => {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [years, setYears] = React.useState([]);
  const [selectedYear, setSelectedYear] = React.useState(null);
  const [selectedUrl, setSelectedUrl] = React.useState(null);

  React.useEffect(() => {
    const csvUrl = 'https://raw.githubusercontent.com/okechukwu95dev/welnessblogs/main/scraped_html_non_media_unique_processed.csv';
    
    fetch(csvUrl)
      .then(response => response.text())
      .then(csvText => {
        const result = Papa.parse(csvText, { 
          header: true, 
          skipEmptyLines: true
        });
        const processedData = result.data;
        setYears([...new Set(processedData.map(item => item.year))].sort());
        setData(processedData);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return React.createElement('div', null, 'Loading...');

  return React.createElement('div', { className: 'p-4' },
    React.createElement('h1', { className: 'text-2xl mb-4' }, 'Wellness Blogs'),
    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
      years.map(year => 
        React.createElement('div', { key: year, className: 'border p-4 rounded' },
          React.createElement('h2', { className: 'text-xl mb-2' }, year),
          data.filter(item => item.year === year).map(item => 
            React.createElement('div', { 
              key: item.url,
              className: 'mb-2 p-2 hover:bg-gray-100 rounded cursor-pointer',
              onClick: () => setSelectedUrl(item.url)
            },
              React.createElement('div', { className: 'font-medium' }, item.date),
              React.createElement('div', { className: 'text-sm text-gray-600' }, item.url),
              selectedUrl === item.url && 
                React.createElement('div', { 
                  className: 'mt-2 p-2 bg-white rounded',
                  dangerouslySetInnerHTML: { __html: item.html_scraped }
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
