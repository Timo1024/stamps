library(igraph)
library(visNetwork)
library(htmlwidgets)

setwd("E:/programming/stamps/src/crawling")

# read in Danzig.csv with colnames
danzig <- read.csv("Danzig.csv", header = TRUE)
danzig <- danzig[, -1]

# plot amount of stamps per year
danzig$Year <- as.numeric(danzig$Year)

# plot amount of stamps per year
# library(ggplot2)
# ggplot(danzig, aes(x = Year)) + geom_bar() + theme_minimal()

# convert the ParentCountry column to a list (looks currently like this: ['Poland', 'Germany'])
all_countries <- read.csv("country_links.csv", header = TRUE)
all_countries$country <- all_countries$X

# loop over all rows
paths <- list()
for (i in 1:nrow(all_countries)) {
  country <- all_countries$country[i]
  parent_countries <- all_countries$parent_countries[i]
  parent_countries <- gsub("\\[|\\]", "", parent_countries)
  parent_countries <- unlist(strsplit(parent_countries, ","))
  parent_countries <- trimws(gsub("'", "", parent_countries))
  continent <- all_countries$continent[i]
  
  paths[[i]] <- c(country, parent_countries, continent, "Earth")
}

# Flatten the list and create a dataframe
df <- do.call(rbind, lapply(paths, function(x) data.frame(tail = x[-1], head = x[-length(x)])))

# remove duplicates
df <- unique(df)

g <- graph_from_data_frame(df, directed = TRUE)

g <- simplify(g, remove.multiple = FALSE, remove.loops = TRUE)

top_parents <- sapply(paths, function(x) tail(x, 3))
V(g)$label <- ifelse(V(g)$name %in% top_parents, V(g)$name, NA)

layout <- layout_with_fr(g, repulserad = layout_with_fr(g)$repulserad * 2)

png(filename = "graph2.png", width = 4000, height = 4000)
plot(g, layout = layout, 
     vertex.size= 0.5,
     edge.arrow.size=0.05,
     vertex.label.cex = 1,
     vertex.label.color = "black"  ,
     vertex.frame.color = adjustcolor("white", alpha.f = 0),
     vertex.color = adjustcolor("white", alpha.f = 0),
     edge.color=adjustcolor(1, alpha.f = 0.15),
     display.isolates=FALSE)
# plot(g, 
#      layout = layout,
#      vertex.size= 0.5,
#      edge.arrow.size=0.5,
#      vertex.label.cex = 0.55,
#      vertex.label.color = "black"  ,
#      vertex.frame.color = adjustcolor("white", alpha.f = 0),
#      vertex.color = adjustcolor("white", alpha.f = 0),
#      edge.color=adjustcolor(1, alpha.f = 0.15),
#      display.isolates=FALSE,
#      vertex.label=ifelse(page_rank(g)$vector > 0.1 , "important nodes", NA))
dev.off()

pages <- read.csv("country_links_pages.csv", header = TRUE)


sum(pages$total_pages)/7 * 44 / 60 / 60









# give the prime factors which multiply to 1178
primeFactors <- function(n) {
  if (n == 1) {
    return(1)
  }
  
  factors <- c()
  d <- 2
  while (n > 1) {
    while (n %% d == 0) {
      factors <- c(factors, d)
      n <- n / d
    }
    d <- d + 1
  }
  
  return(factors)
}
primeFactors(1178)








all_countries$parent_countries <- gsub("\\[|\\]", "", all_countries$parent_countries)
all_countries$parent_countries <- unlist(strsplit(all_countries$parent_countries, ","))
all_countries$parent_countries <- trimws(gsub("'", "", all_countries$parent_countries))


# remove the ' from each string
all_countries$parent_countries <- gsub("'", "", all_countries$parent_countries)
all_countries$parent_countries <- strsplit(all_countries$parent_countries, ", ")

# create a new column where country, parent_countries, continent are concatenated
all_countries$path <- paste(all_countries$country, all_countries$parent_countries, all_countries$continent, sep = ", ")

# Create the edge list
edges <- data.frame(
  from = adf_unlisted$country,
  to = adf_unlisted$parent_countries
)

g <- graph_from_data_frame(edges, directed = TRUE)

g <- simplify(g, remove.multiple = FALSE, remove.loops = TRUE)

# Plot the graph
png(filename = "graph.png", width = 800, height = 600)
plot(g, vertex.size = 5, vertex.label.cex = 0.5, edge.arrow.size = 0.5)
dev.off()






