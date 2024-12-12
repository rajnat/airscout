const fetchDeals = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:5000/deals/flexible", {
        params: {
          origin: "JFK",
          max_weeks: weeks,
          adults: 1,
        },
      });
      setDeals(response.data);
    } catch (error) {
      console.error("Error fetching flight deals:", error);
    }
    setLoading(false);
  };
  