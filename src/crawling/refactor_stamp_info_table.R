
setwd("E:/programming/stamps/src/crawling")

library(stringr)
library(dplyr)
library(png)
library(jpeg)

# load all_countries.csv file
all_countries <- read.csv("all_countries.csv")

###########################
# adding year span column #
###########################

all_countries_temp_3 <- all_countries

all_countries_temp_3 <- all_countries_temp_3 %>%
  mutate(year_end = str_extract(SetDescription, "^-\\d{4}")) %>%
  mutate(YearSpan = ifelse(is.na(year_end), Year, paste0(Year, "-", year_end))) %>%
  mutate(SetDescription = trimws(ifelse(!is.na(year_end), str_replace(SetDescription, "^-\\d{4} ", ""), SetDescription))) %>%
  # remove - from start of setDescription if it is there
  mutate(SetDescription = trimws(str_replace(SetDescription, "^-", ""))) %>%
  select(-year_end)
  # remove -[year]    from setDescription if it is there

filtered <- all_countries_temp_3[grepl("^-", all_countries_temp_3$SetDescription),]



##############################################
# adding column with path to watermark image #
##############################################

all_countries_temp_4 <- all_countries_temp_3

# path is /images/[Country]/[GroupID]/
all_countries_temp_4 <- all_countries_temp_4 %>%
  mutate(PathToWatermark = paste0("/images/", Country, "/", GroupID, "/"))

all_countries_temp_4 <- all_countries_temp_4 %>%
  select(-X)

head(all_countries_temp_4)

# save again as scv
write.csv(all_countries_temp_4, "all_countries_2.csv", row.names = FALSE)

# get a random GroupID from the data and print all information about this group (multiple rows)

# get random groupID from table
groupID <- all_countries_temp_4[sample(1:nrow(all_countries_temp_4), 1),]$GroupID
# print infos about all rows (stamps) of this group
all_countries_temp_4[all_countries_temp_4$GroupID == groupID,]
# print all images of this group
path <- unique(all_countries_temp_4[all_countries_temp_4$GroupID == groupID,]$PathToWatermark)[1]
# get path of all images in the path folder
paths <- list.files(paste0("E:/programming/stamps/src/crawling", path), full.names = TRUE)

# plot the .jpg images
par(mfrow=c(1, length(paths)))
for (i in 1:length(paths)) {
  img <- readJPEG(paths[i])
  plot(0:1, 0:1, type='n', xlab='', ylab='', xlim=c(0, 1), ylim=c(0, 1))
  rasterImage(img, 0, 0, 1, 1)
}











