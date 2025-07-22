document.addEventListener('DOMContentLoaded', function() {
    // Announcement data - in a real app, this would come from a database
    const announcements = [
        "🎉 EMRS Entrance Exam 2024 registration starts from 15th June!",
        "📢 School reopens on 1st July after summer break",
        "🏆 Our students won 3 gold medals in state-level sports competition",
        "📚 New library books added - visit the library to explore",
        "🌱 Tree plantation drive on 5th June - World Environment Day"
    ];
    
    const announcementBar = document.querySelector('.announcement-bar marquee');
    
    // Function to update announcements
    function updateAnnouncements() {
        // Clear existing content
        announcementBar.innerHTML = '';
        
        // Add new announcements
        announcements.forEach(announcement => {
            const span = document.createElement('span');
            span.className = 'announcement-item';
            span.textContent = announcement;
            announcementBar.appendChild(span);
        });
    }
    
    // Initial update
    updateAnnouncements();
    
    // In a real implementation, you might fetch announcements from a server periodically
    // setInterval(fetchAnnouncements, 60000); // Fetch every minute
    
    // Example function to fetch announcements from a server
    function fetchAnnouncements() {
        fetch('/api/announcements')
            .then(response => response.json())
            .then(data => {
                announcements.length = 0; // Clear existing
                data.forEach(item => announcements.push(item.text));
                updateAnnouncements();
            })
            .catch(error => console.error('Error fetching announcements:', error));
    }
});