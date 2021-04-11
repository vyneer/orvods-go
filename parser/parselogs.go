package parser

import (
	"bytes"
	"encoding/json"
	"errors"
	"html"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/vosmith/pancake"
)

// Dictionary simplifies parsing chatlogs later.
type Dictionary map[string]interface{}

type Result struct {
	Order int
	Text  string
}

func indexOf(word string, data []string) int {
	for k, v := range data {
		if word == v {
			return k
		}
	}
	return -1
}

func indexOfReverse(word string, data []string) int {
	for i := len(data) - 1; i >= 0; i-- {
		if word == data[i] {
			return i
		}
	}
	return -1
}

//from here https://medium.com/@dhanushgopinath/concurrent-http-downloads-using-go-32fecfa1ed27
func downloadFile(client *http.Client, URL string, order int) (int, string, error) {
	req, _ := http.NewRequest("GET", string(URL), nil)
	response, err := client.Do(req)
	if err != nil {
		return order, "", err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return order, "", errors.New(response.Status)
	}
	var data bytes.Buffer
	_, err = io.Copy(&data, response.Body)
	if err != nil {
		return order, "", err
	}
	return order, data.String(), nil
}

// from here https://medium.com/@dhanushgopinath/concurrent-http-downloads-using-go-32fecfa1ed27
func downloadMultipleFiles(client *http.Client, urls []string) ([][]string, error) {
	pages := make(map[int][]string)
	var ret_pages [][]string
	done := make(chan Result, len(urls))
	errch := make(chan error, len(urls))
	for i, URL := range urls {
		go func(URL string, count int) {
			c, b, err := downloadFile(client, URL, count)
			if err != nil {
				errch <- err
				done <- Result{}
				return
			}
			done <- Result{c, b}
			errch <- nil
		}(URL, i)
	}
	var errStr string
	for i := 0; i < len(urls); i++ {
		result := <-done
		buf := strings.Split(result.Text, "\n")
		pages[result.Order] = buf[:len(buf)-1]
		if err := <-errch; err != nil {
			errStr = errStr + " " + err.Error()
		}
	}
	var err error
	if errStr != "" {
		err = errors.New(errStr)
	}
	for i := 0; i < len(urls); i++ {
		ret_pages = append(ret_pages, pages[i])
	}
	return ret_pages, err
}

// GetTextFiles downloads logs from OverRustleLogs
// starting and ending at specific timestamps
// and returns an array of chatlines.
func GetTextFiles(urls, from, to string) ([]string, error) {
	var arr []string
	var timestamps []string
	fromStamp := from
	toStamp := to
	startCheck := false
	endCheck := false
	startPos := 0
	endPos := 0
	pattern := `^([01]?[0-9]|2[0-3])\:[0-5][0-9]\:[0-5][0-9]$`
	_ = json.Unmarshal([]byte(urls), &arr)

	var transport http.RoundTripper = &http.Transport{
		DisableKeepAlives: true,
	}

	client := &http.Client{Transport: transport}

	pages, err := downloadMultipleFiles(client, arr)
	if err != nil {
		return []string{"error"}, err
	}

	flat, err := pancake.Strings(pages)
	if err != nil {
		return []string{"error"}, err
	}

	if len(flat) > 0 {
		// get all the timestamps to a slice
		for _, page := range flat {
			timestamps = append(timestamps, page[1:24])
		}

		// check if it's actually timestamps in the timestamp slice
		matched, err := regexp.Match(pattern, []byte(timestamps[0][11:19]))
		if err != nil {
			return []string{}, err
		}
		if matched {
			// search for "from" and "to" timestamps with 1 second adjustments in case the exact timestamps dont exists
			firstTimestamp, _ := time.Parse("2006-01-02 15:04:05 UTC", timestamps[0])
			lastTimestamp, _ := time.Parse("2006-01-02 15:04:05 UTC", timestamps[len(timestamps)-1])
			for !startCheck {
				index := indexOf(fromStamp, timestamps)
				if index != -1 {
					startPos = index
					startCheck = true
				} else {
					t, _ := time.Parse("2006-01-02 15:04:05 UTC", fromStamp)
					if int(t.Sub(firstTimestamp).Seconds()) < 0 {
						startPos = 0
						startCheck = true
					}
					t = t.Add(-1 * time.Second)
					fromStamp = t.Format("2006-01-02 15:04:05 UTC")
				}
			}
			for !endCheck {
				index := indexOfReverse(toStamp, timestamps)
				if index != -1 {
					endPos = index
					endCheck = true
				} else {
					t, _ := time.Parse("2006-01-02 15:04:05 UTC", toStamp)
					if int(t.Sub(lastTimestamp).Seconds()) > 0 {
						endPos = len(timestamps) - 1
						endCheck = true
					}
					t = t.Add(1 * time.Second)
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
