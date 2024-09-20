$('#generate-btn').click(function() {
    // Get values from the form
    var inputSentences = $('#input-text').val().match(/(['"]).*?\1/g);  // Match sentences inside single or double quotes
    var attentionWeights = $('#attentions').val().trim().split(',').map(parseFloat);
    var title = $('#title').val().trim();
    var summary = $('#summary').val().trim();
    var filterValue = $('#filter').val(); // Get the value of the top N filter

    // Ensure the number of sentences and attention weights match
    if (inputSentences.length !== attentionWeights.length) {
        alert('Number of sentences and attention weights must match.');
        return;
    }

    // Remove quotes from each sentence
    inputSentences = inputSentences.map(sentence => sentence.slice(1, -1));

    // Open a new window for the text plot
    var newWindow = window.open('', '_blank', 'width=800,height=600');

    // Add content to the new window with embedded CSS for title and summary font-size
    newWindow.document.write(`
        <html>
        <head>
            <title>Generated Text Plot</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    padding: 20px;
                }
                h3.title {
                    font-size: 28px; /* Dynamically set the font size for the title */
                    font-weight: bold;
                }
                h3.summary {
                    font-size: 18px; /* Dynamically set the font size for the summary */
                    font-weight: normal;
                }
                .container {
                    display: block;
                    margin: 0; /* Ensure sentences are displayed like a paragraph */
                    padding: 0;
                    line-height: 1.5;
                }
                span.sentence {
                    display: inline; /* Display the sentences inline to form a paragraph */
                    background-color: transparent;
                    padding: 0;
                    margin: 0;
                    font-size: 14px;
                    white-space: normal; /* Allow text to wrap like a paragraph */
                }
                .tooltip {
                    position: absolute;
                    background-color: #333;
                    color: #fff;
                    padding: 8px 12px;
                    border-radius: 8px;
                    font-size: 14px;
                    display: none; /* Initially hidden */
                    z-index: 1000;
                    box-shadow: 0px 2px 10px rgba(0, 0, 0, 0.1);
                    pointer-events: none; /* Prevent tooltip from interfering with hover events */
                    white-space: nowrap; /* Keep tooltip text on one line */
                }
            </style>
        </head>
        <body>
        <h3 class="title">Title: ${title}</h3>
        <h3 class="summary">Summary: ${summary}</h3>
        <h3>Input Text:</h3>
        <div class="container"></div>
        <div class="tooltip"></div>
    `);

    // Normalize the attention weights
    var minAttention = Math.min(...attentionWeights);
    var maxAttention = Math.max(...attentionWeights);
    var normalizedAttentions = (minAttention === maxAttention) ? attentionWeights.map(() => 0.5) : attentionWeights.map(attention => (attention - minAttention) / (maxAttention - minAttention));

    // Combine sentences with their attention weights
    var sentenceObjects = inputSentences.map((sentence, i) => ({ sentence, attention: normalizedAttentions[i] }));

    // Sort by attention weight and apply filter (select top N)
    if (filterValue !== 'all') {
        sentenceObjects.sort((a, b) => b.attention - a.attention); // Sort by descending attention
        sentenceObjects = sentenceObjects.slice(0, parseInt(filterValue)); // Select top N sentences
    }

    // Color scale for attention weights
    var colorScale = d3.scaleLinear()
        .domain([0, 1])
        .range(["#E0FFFF", "#87CEEB"]);  // Light blue shades

    // Add dynamically generated sentences to the new window
    var container = newWindow.document.querySelector('.container'); // Container to append sentences

    // Dynamically generate sentence spans and append to the container
    sentenceObjects.forEach(function(obj, i) {
        var span = newWindow.document.createElement('span');
        span.className = 'sentence';
        span.textContent = obj.sentence + (i < sentenceObjects.length - 1 ? ' ' : '');  // Add a space between sentences

        // Set the background color based on attention weight
        span.style.backgroundColor = colorScale(obj.attention);

        // Add the attention as a data attribute for tooltips
        span.setAttribute('data-attention', obj.attention.toFixed(2));

        // Append the sentence span to the container as part of the paragraph
        container.appendChild(span);
    });

    newWindow.document.write(`
        <script>
            var sentences = document.querySelectorAll('.sentence');
            var tooltip = document.querySelector('.tooltip');
            
            sentences.forEach(function(sentence) {
                sentence.addEventListener('mouseover', function(event) {
                    // Set tooltip content with rounded attention weight
                    tooltip.style.display = 'block';
                    tooltip.innerText = 'Attention Weight: ' + sentence.getAttribute('data-attention');
                    
                    // Position the tooltip just below the hovered sentence
                    var rect = sentence.getBoundingClientRect(); // Get the position of the sentence element
                    tooltip.style.left = rect.left + 'px'; // Align tooltip to the left of the sentence
                    tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px'; // Position it just below the sentence
                });

                sentence.addEventListener('mouseout', function() {
                    tooltip.style.display = 'none'; // Hide the tooltip when not hovering
                });
            });
        <\/script>
        </body>
        </html>
    `);

    newWindow.document.close();
});