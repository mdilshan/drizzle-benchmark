local cjson = require("cjson")
local requests = {}
local host = "http://localhost:4000"

local function load_requests()
    local file = io.open("data/requests.json", "r")
    local content = file:read("*a")
    file:close()

    local data = cjson.decode(content)

    for _, it in ipairs(data) do
        if not it:find("^/search") then
            -- example `it` value is "/products/1"
            table.insert(requests, it)
        end
    end
end

init = function()
    load_requests()
end


request = function()
    local params = requests[math.random(#requests)]
    print(params)
    return wrk.format("GET", host .. params)   
end
