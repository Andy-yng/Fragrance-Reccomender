import React, { useEffect, useState } from 'react';
import './App.css';
import Chatbot from './Chatbot';

function App() {
  const [fragrances, setFragrances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState('fragrances'); // 'fragrances' or 'chatbot'

  useEffect(() => {
    fetch('/api/fragrances')
      .then(res => res.json())
      .then(data => {
        setFragrances(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex justify-center items-center h-screen text-lg">Loading fragrances...</div>;
  if (error) return <div className="flex justify-center items-center h-screen text-red-500">Error: {error}</div>;

  // Show chatbot page
  if (page === 'chatbot') {
    return (
      <div>
        <div className="sticky top-0 bg-white border-b border-gray-200 shadow">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Fragrance Recommender</h1>
            <button
              onClick={() => setPage('fragrances')}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              View Collection
            </button>
          </div>
        </div>
        <Chatbot />
      </div>
    );
  }

  // Show fragrances page
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100">
      {/* Navigation */}
      <div className="sticky top-0 bg-white border-b border-gray-200 shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-red-600">Fragrance Recommender</h1>
          <button
            onClick={() => setPage('chatbot')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Get Recommendations
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">Fragrance Collection</h1>
          <p className="text-lg text-gray-600">Discover our premium selection of fragrances</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {fragrances.map((fragrance) => (
            <div key={fragrance.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="h-32 bg-gray-200 overflow-hidden flex items-center justify-center">
                <img src={fragrance.image} alt={fragrance.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-6">
                <p className="text-sm text-red-600 font-semibold uppercase tracking-wide">{fragrance.brand}</p>
                <h2 className="text-2xl font-bold text-gray-800 mt-2 mb-3">{fragrance.name}</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Bottle Size:</span>
                    <span className="font-semibold text-gray-800">{fragrance.bottleSize}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Price:</span>
                    <span className="text-2xl font-bold text-red-600">${fragrance.price}</span>
                  </div>
                </div>

                <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors duration-200">
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
