package parser

import (
	"bytes"
	"errors"
	"fmt"
	"html"
	"io"
	"net/http"
	"regexp"
	"strings"
	"time"

	"github.com/vosmith/pancake"
	log "github.com/vyneer/orvods-go/logger"
)

var ErrBadRequest = errors.New("400 Bad Request")
var ErrNotFound = errors.New("404 Not Found")
var ErrForbidden = errors.New("403 Forbidden")
var ErrTooManyRequests = errors.New("429 Too Many Requests")
var ErrInternalServerError = errors.New("500 Internal Server Error")
var ErrBadGateway = errors.New("502 Bad Gateway")
var ErrServiceUnavailable = errors.New("503 Service Unavailable")
var ErrMovedTemporarily = errors.New("302 Moved Temporarily")
var ErrDownloadError = errors.New("download error")

var transport http.RoundTripper = &http.Transport{
	DisableKeepAlives: true,
}

var client *http.Client = &http.Client{
	Transport: transport,
	Timeout:   10 * time.Second,
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		return ErrMovedTemporarily
	},
}

var timestampRegex = regexp.MustCompile(`^([01]?[0-9]|2[0-3])\:[0-5][0-9]\:[0-5][0-9]$`)

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

// from here https://medium.com/@dhanushgopinath/concurrent-http-downloads-using-go-32fecfa1ed27
func downloadFile(client *http.Client, URL string, order int) (int, string, error) {
	req, _ := http.NewRequest("GET", string(URL), nil)
	response, err := client.Do(req)
	if err != nil {
		return order, "", err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		switch response.StatusCode {
		case http.StatusBadRequest:
			return order, "", ErrBadRequest
		case http.StatusNotFound:
			return order, "", ErrNotFound
		case http.StatusForbidden:
			return order, "", ErrForbidden
		case http.StatusTooManyRequests:
			return order, "", ErrTooManyRequests
		case http.StatusInternalServerError:
			return order, "", ErrInternalServerError
		case http.StatusBadGateway:
			return order, "", ErrBadGateway
		case http.StatusServiceUnavailable:
			return order, "", ErrServiceUnavailable
		default:
			return order, "", errors.New(response.Status)
		}
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
	for i := 0; i < len(urls); i++ {
		result := <-done
		buf := strings.Split(result.Text, "\n")
		pages[result.Order] = buf[:len(buf)-1]
		if err := <-errch; err != nil {
			return ret_pages, err
		}
	}
	for i := 0; i < len(urls); i++ {
		ret_pages = append(ret_pages, pages[i])
	}
	return ret_pages, nil
}

func getOverRustleURLs(from, to time.Time) []string {
	var urlSlice []string

	fromRound := time.Date(from.Year(), from.Month(), from.Day(), 0, 0, 0, 0, from.Location())
	toRound := time.Date(to.Year(), to.Month(), to.Day(), 0, 0, 0, 0, to.Location())
	diff := toRound.Sub(fromRound)

	for i := 0; i <= int(diff.Hours()); i += 24 {
		bufferTime := from.Add(time.Duration(i) * time.Hour)
		url := "https://dgg.overrustlelogs.net/Destinygg%20chatlog/" +
			bufferTime.Format("January") + "%20" +
			bufferTime.Format("2006") + "/" +
			bufferTime.Format("2006") + "-" +
			bufferTime.Format("01") + "-" + bufferTime.Format("02") + ".txt"
		urlSlice = append(urlSlice, url)
	}

	return urlSlice
}

func GetDBLines(from, to string) ([]byte, error) {
	fromStamp, err := time.Parse("2006-01-02 15:04:05 UTC", from)
	if err != nil {
		return nil, err
	}
	toStamp, err := time.Parse("2006-01-02 15:04:05 UTC", to)
	if err != nil {
		return nil, err
	}

	fromFormatted := fromStamp.Format("2006-01-02T15:04:05Z")
	toFormatted := toStamp.Format("2006-01-02T15:04:05Z")

	url := fmt.Sprintf("https://vyneer.me/tools/logs?from=%s&to=%s", fromFormatted, toFormatted)

	req, _ := http.NewRequest("GET", url, nil)
	response, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		switch response.StatusCode {
		case http.StatusBadRequest:
			return nil, ErrBadRequest
		case http.StatusNotFound:
			return nil, ErrNotFound
		case http.StatusForbidden:
			return nil, ErrForbidden
		case http.StatusTooManyRequests:
			return nil, ErrTooManyRequests
		case http.StatusInternalServerError:
			return nil, ErrInternalServerError
		case http.StatusBadGateway:
			return nil, ErrBadGateway
		case http.StatusServiceUnavailable:
			return nil, ErrServiceUnavailable
		default:
			return nil, errors.New(response.Status)
		}
	}
	b, err := io.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}
	return b, nil
}

// GetTextFiles downloads logs from OverRustleLogs
// starting and ending at specific timestamps
// and returns an array of chatlines.
func GetTextFiles(from, to string) ([]string, error) {
	var timestamps []string

	fromStamp, err := time.Parse("2006-01-02 15:04:05 UTC", from)
	if err != nil {
		return []string{"error"}, err
	}
	toStamp, err := time.Parse("2006-01-02 15:04:05 UTC", to)
	if err != nil {
		return []string{"error"}, err
	}
	startCheck := false
	endCheck := false
	startPos := 0
	endPos := 0

	arr := getOverRustleURLs(fromStamp, toStamp)
	log.Debugf("got the URLs: %+v", arr)

	pages, err := downloadMultipleFiles(client, arr)
	if err != nil {
		return []string{"error"}, errors.Join(err, ErrDownloadError)
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
		matched := timestampRegex.Match([]byte(timestamps[0][11:19]))
		if err != nil {
			return []string{}, err
		}
		if matched {
			// search for "from" and "to" timestamps with 1 second adjustments in case the exact timestamps dont exists
			firstTimestamp, _ := time.Parse("2006-01-02 15:04:05 UTC", timestamps[0])
			lastTimestamp, _ := time.Parse("2006-01-02 15:04:05 UTC", timestamps[len(timestamps)-1])
			for !startCheck {
				index := indexOf(from, timestamps)
				if index != -1 {
					startPos = index
					startCheck = true
				} else {
					t, _ := time.Parse("2006-01-02 15:04:05 UTC", from)
					if int(t.Sub(firstTimestamp).Seconds()) < 0 {
						startPos = 0
						startCheck = true
					}
					t = t.Add(-1 * time.Second)
					from = t.Format("2006-01-02 15:04:05 UTC")
				}
			}
			for !endCheck {
				index := indexOfReverse(to, timestamps)
				if index != -1 {
					endPos = index
					endCheck = true
				} else {
					t, _ := time.Parse("2006-01-02 15:04:05 UTC", to)
					if int(t.Sub(lastTimestamp).Seconds()) > 0 {
						endPos = len(timestamps) - 1
						endCheck = true
					}
					t = t.Add(1 * time.Second)
					to = t.Format("2006-01-02 15:04:05 UTC")
				}
			}
		}
	}

	return flat[startPos:endPos], nil
}

// ParseChat parses chatlins from an array of strings
// and return a map of chatlines with unix timestamps as keys.
func ParseChat(chatlines []string) map[int64][]Dictionary {
	chatHash := make(map[int64][]Dictionary)

	for _, chatLine := range chatlines {
		index := strings.Index(chatLine, ": ")
		length := len(chatLine)

		timestamp, _ := time.Parse("2006-01-02 15:04:05 UTC", chatLine[1:24])
		timestampFormatted := timestamp.Unix()
		username := chatLine[26:index]
		message := html.EscapeString(chatLine[index+2 : length])
		chatHash[timestampFormatted] = append(chatHash[timestampFormatted], Dictionary{"message": message, "username": username})
	}

	return chatHash
}
