class CityProfile {
  const CityProfile({
    required this.tag,
    required this.category,
    required this.highlight,
    required this.description,
    required this.bestTime,
    required this.image,
  });

  final String tag;
  final String category;
  final String highlight;
  final String description;
  final String bestTime;
  final String image;
}

const Map<String, CityProfile> _cityProfiles = {
  'Goa': CityProfile(
    tag: 'Beach Escapes',
    category: 'beach',
    highlight: 'Candolim, Baga & Calangute beachfront stays',
    description: 'Golden beaches, vibrant shacks, private villas and heritage Portuguese quarters.',
    bestTime: 'Nov – Feb',
    image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1200&q=80',
  ),
  'Udaipur': CityProfile(
    tag: 'Royal Palaces',
    category: 'palaces',
    highlight: 'Lake Pichola & historic havelis',
    description: 'Majestic marble palaces on romantic lakes, royal courtyards and sunset boat rides.',
    bestTime: 'Oct – Mar',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
  ),
  'Manali': CityProfile(
    tag: 'Hill Stations',
    category: 'hills',
    highlight: 'Solang Valley & cedar forests',
    description: 'Snow-capped Himalayan peaks, pine-scented valleys, adventure camps and cosy cottages.',
    bestTime: 'All year',
    image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
  ),
  'Jaipur': CityProfile(
    tag: 'Heritage & Forts',
    category: 'palaces',
    highlight: 'Pink City forts & luxury courtyards',
    description: 'Grand Amber Fort, royal heritage palaces, historic bazaars and warm Rajasthani hospitality.',
    bestTime: 'Oct – Mar',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
  ),
  'Bhilwara': CityProfile(
    tag: 'Textile Hub & Stays',
    category: 'palaces',
    highlight: 'Hotel Rishi, Royal Inn & central commercial stays',
    description: 'The City of Textiles, with majestic fortresses, peaceful shrines and comfortable business stays.',
    bestTime: 'Oct – Mar',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
  ),
  'Munnar': CityProfile(
    tag: 'Nature Retreats',
    category: 'hills',
    highlight: 'Misty tea plantations & valleys',
    description: 'Rolling emerald tea hills, mountain waterfalls, cool mist and boutique plantation stays.',
    bestTime: 'Sep – May',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80',
  ),
  'Alleppey': CityProfile(
    tag: 'Backwaters',
    category: 'beach',
    highlight: 'Vembanad Lake & private houseboats',
    description: 'Serene palm-fringed canals, traditional houseboats, Ayurvedic spas and lagoon villas.',
    bestTime: 'Nov – Feb',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1200&q=80',
  ),
  'Mumbai': CityProfile(
    tag: 'Metros & Coast',
    category: 'metro',
    highlight: 'Marine Drive & coastal commercial stays',
    description: 'The City of Dreams, iconic coastal drives, boutique hotels and bustling commercial centres.',
    bestTime: 'Oct – Mar',
    image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=1200&q=80',
  ),
  'Bengaluru': CityProfile(
    tag: 'Metros & Tech',
    category: 'metro',
    highlight: 'Indiranagar & luxury business hotels',
    description: 'India’s Silicon Valley, lush parks, contemporary dining and premier executive suites.',
    bestTime: 'All year',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
  ),
  'Delhi': CityProfile(
    tag: 'Capital & Heritage',
    category: 'metro',
    highlight: 'Connaught Place & historic Mughal stays',
    description: 'India’s historic capital, diplomatic quarter, sprawling monuments and luxury transit hotels.',
    bestTime: 'Oct – Mar',
    image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=1200&q=80',
  ),
};

const Map<String, String> cityCategoryLabels = {
  'all': 'All Destinations',
  'beach': 'Beach & Coastal',
  'palaces': 'Palaces & Heritage',
  'hills': 'Hills & Nature',
  'metro': 'Metros & Commercial',
};

const List<String> cityCategoryOrder = ['all', 'beach', 'palaces', 'hills', 'metro'];

CityProfile cityProfileFor(String city) {
  return _cityProfiles[city] ??
      CityProfile(
        tag: 'Popular Destination',
        category: 'metro',
        highlight: 'Verified boutique stays and city hotels',
        description: 'Handpicked, verified accommodations in $city.',
        bestTime: 'Oct – Mar',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
      );
}
