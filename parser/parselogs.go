package parser

import (
	"encoding/json"
	"html"
	"io/ioutil"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/vosmith/pancake"
)

// Dictionary simplifies parsing chatlogs later.
type Dictionary map[string]interface{}

func indexOf(word string, data []string) int {
	for k, v := range data {
		if word == v {
			return k
		}
	}
	return -1
}

// GetTextFiles downloads logs from OverRustleLogs
// starting and ending at specific timestamps
// and returns an array of chatlines.
func GetTextFiles(urls, from, to string) ([]string, error) {
	var pages [][]string
	var arr []string
	var timestamps []string
	fromStamp := from
	toStamp := to
	startPos := 0
	endPos := 0
	pattern := `^([01]?[0-9]|2[0-3])\:[0-5][0-9]\:[0-5][0-9]$`
	_ = json.Unmarshal([]byte(urls), &arr)

	var transport http.RoundTripper = &http.Transport{
		DisableKeepAlives: true,
	}

	client := &http.Client{Transport: transport}

	for _, url := range arr {
		req, _ := http.NewRequest("GET", string(url), nil)
		textFile, err := client.Do(req)
		if err != nil {
			return []string{"error"}, err
		}
		defer textFile.Body.Close()
		body, err := ioutil.ReadAll(textFile.Body)
		if err != nil {
			return []string{"error"}, err
		}

		page := strings.Split(string(body), "\n")
		//page = append([]string(nil), page[:len(page)-1]...)
		page = page[:len(page)-1]
		pages = append(pages, page)
	}

	flat, err := pancake.Strings(pages)
	if err != nil {
		return []string{"error"}, err
	}

	if len(flat) > 0 {
		for _, page := range flat {
			timestamps = append(timestamps, page[1:24])
		}

		matched, err := regexp.Match(pattern, []byte(timestamps[0][11:19]))
		if err != nil {
			return []string{"error"}, err
		}
		if matched {
			for startPos == 0 {
				index := indexOf(fromStamp, timestamps)
				if index != -1 {
					startPos = index
				} else {
					t, _ := time.Parse("2006-01-02 15:04:05 UTC", fromStamp)
					t = t.Add(-1 * time.Second)
					fromStamp = t.Format("2006-01-02 15:04:05 UTC")
				}
			}
			for endPos == 0 {
				index := indexOf(toStamp, timestamps)
				if index != -1 {
					endPos = index
				} else {
					t, _ := time.Parse("2006-01-02 15:04:05 UTC", toStamp)
					t = t.Add(-1 * time.Second)
					toStamp = t.Format("2006-01-02 15:04:05 UTC")
				}
			}
		}
	}

	return flat[startPos:endPos], nil
}

// ParseChat parses chatlins from an array of strings
// and return a map of chatlines sorted by timestamp.
func ParseChat(chatlines []string) map[string][]Dictionary {
	chatHash := make(map[string][]Dictionary)

	for _, chatLine := range chatlines {
		index := strings.Index(chatLine, ": ")
		length := len(chatLine)

		timestamp, _ := time.Parse("2006-01-02 15:04:05 UTC", chatLine[1:24])
		timestamp1 := timestamp.Format(time.RFC3339)
		username := chatLine[26:index]
		message := html.EscapeString(chatLine[index+2 : length])
		buf := chatHash[timestamp1]
		buf = append(buf, Dictionary{"message": message, "username": username})
		chatHash[timestamp1] = buf
	}

	return chatHash
}
