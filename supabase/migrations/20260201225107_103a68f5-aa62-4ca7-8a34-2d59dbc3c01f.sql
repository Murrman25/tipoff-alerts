-- Insert NCAAF and NCAAB teams sharing the same logo files
-- Schools with uploaded logos get entries for BOTH leagues
INSERT INTO public.teams (id, display_name, city, league, sport, logo_filename, sportsgameodds_id) 
VALUES
  -- Akron
  ('akron_ncaaf', 'Akron Zips', 'Akron', 'NCAAF', 'FOOTBALL', 'ncaaf/Akron', 'AKRON_NCAAF'),
  ('akron_ncaab', 'Akron Zips', 'Akron', 'NCAAB', 'BASKETBALL', 'ncaaf/Akron', 'AKRON_NCAAB'),
  -- Air Force
  ('air_force_ncaaf', 'Air Force Falcons', 'Colorado Springs', 'NCAAF', 'FOOTBALL', 'ncaaf/Air Force', 'AIR_FORCE_NCAAF'),
  ('air_force_ncaab', 'Air Force Falcons', 'Colorado Springs', 'NCAAB', 'BASKETBALL', 'ncaaf/Air Force', 'AIR_FORCE_NCAAB'),
  -- Alabama
  ('alabama_ncaaf', 'Alabama Crimson Tide', 'Tuscaloosa', 'NCAAF', 'FOOTBALL', 'ncaaf/Alabama', 'ALABAMA_NCAAF'),
  ('alabama_ncaab', 'Alabama Crimson Tide', 'Tuscaloosa', 'NCAAB', 'BASKETBALL', 'ncaaf/Alabama', 'ALABAMA_NCAAB'),
  -- Appalachian State
  ('appalachian_state_ncaaf', 'Appalachian State Mountaineers', 'Boone', 'NCAAF', 'FOOTBALL', 'ncaaf/Appalachian State', 'APPALACHIAN_STATE_NCAAF'),
  ('appalachian_state_ncaab', 'Appalachian State Mountaineers', 'Boone', 'NCAAB', 'BASKETBALL', 'ncaaf/Appalachian State', 'APPALACHIAN_STATE_NCAAB'),
  -- Arizona
  ('arizona_ncaaf', 'Arizona Wildcats', 'Tucson', 'NCAAF', 'FOOTBALL', 'ncaaf/Arizona', 'ARIZONA_NCAAF'),
  ('arizona_ncaab', 'Arizona Wildcats', 'Tucson', 'NCAAB', 'BASKETBALL', 'ncaaf/Arizona', 'ARIZONA_NCAAB'),
  -- Arizona State
  ('arizona_state_ncaaf', 'Arizona State Sun Devils', 'Tempe', 'NCAAF', 'FOOTBALL', 'ncaaf/Arizona State', 'ARIZONA_STATE_NCAAF'),
  ('arizona_state_ncaab', 'Arizona State Sun Devils', 'Tempe', 'NCAAB', 'BASKETBALL', 'ncaaf/Arizona State', 'ARIZONA_STATE_NCAAB'),
  -- Arkansas
  ('arkansas_ncaaf', 'Arkansas Razorbacks', 'Fayetteville', 'NCAAF', 'FOOTBALL', 'ncaaf/Arkansas', 'ARKANSAS_NCAAF'),
  ('arkansas_ncaab', 'Arkansas Razorbacks', 'Fayetteville', 'NCAAB', 'BASKETBALL', 'ncaaf/Arkansas', 'ARKANSAS_NCAAB'),
  -- Arkansas State
  ('arkansas_state_ncaaf', 'Arkansas State Red Wolves', 'Jonesboro', 'NCAAF', 'FOOTBALL', 'ncaaf/Arkansas State', 'ARKANSAS_STATE_NCAAF'),
  ('arkansas_state_ncaab', 'Arkansas State Red Wolves', 'Jonesboro', 'NCAAB', 'BASKETBALL', 'ncaaf/Arkansas State', 'ARKANSAS_STATE_NCAAB'),
  -- Army
  ('army_ncaaf', 'Army Black Knights', 'West Point', 'NCAAF', 'FOOTBALL', 'ncaaf/Army', 'ARMY_NCAAF'),
  ('army_ncaab', 'Army Black Knights', 'West Point', 'NCAAB', 'BASKETBALL', 'ncaaf/Army', 'ARMY_NCAAB'),
  -- Auburn
  ('auburn_ncaaf', 'Auburn Tigers', 'Auburn', 'NCAAF', 'FOOTBALL', 'ncaaf/Auburn', 'AUBURN_NCAAF'),
  ('auburn_ncaab', 'Auburn Tigers', 'Auburn', 'NCAAB', 'BASKETBALL', 'ncaaf/Auburn', 'AUBURN_NCAAB'),
  -- Ball State
  ('ball_state_ncaaf', 'Ball State Cardinals', 'Muncie', 'NCAAF', 'FOOTBALL', 'ncaaf/Ball State', 'BALL_STATE_NCAAF'),
  ('ball_state_ncaab', 'Ball State Cardinals', 'Muncie', 'NCAAB', 'BASKETBALL', 'ncaaf/Ball State', 'BALL_STATE_NCAAB'),
  -- Baylor
  ('baylor_ncaaf', 'Baylor Bears', 'Waco', 'NCAAF', 'FOOTBALL', 'ncaaf/Baylor', 'BAYLOR_NCAAF'),
  ('baylor_ncaab', 'Baylor Bears', 'Waco', 'NCAAB', 'BASKETBALL', 'ncaaf/Baylor', 'BAYLOR_NCAAB'),
  -- Boise State
  ('boise_state_ncaaf', 'Boise State Broncos', 'Boise', 'NCAAF', 'FOOTBALL', 'ncaaf/Boise State', 'BOISE_STATE_NCAAF'),
  ('boise_state_ncaab', 'Boise State Broncos', 'Boise', 'NCAAB', 'BASKETBALL', 'ncaaf/Boise State', 'BOISE_STATE_NCAAB'),
  -- Boston College
  ('boston_college_ncaaf', 'Boston College Eagles', 'Chestnut Hill', 'NCAAF', 'FOOTBALL', 'ncaaf/Boston College', 'BOSTON_COLLEGE_NCAAF'),
  ('boston_college_ncaab', 'Boston College Eagles', 'Chestnut Hill', 'NCAAB', 'BASKETBALL', 'ncaaf/Boston College', 'BOSTON_COLLEGE_NCAAB'),
  -- Bowling Green
  ('bowling_green_ncaaf', 'Bowling Green Falcons', 'Bowling Green', 'NCAAF', 'FOOTBALL', 'ncaaf/Bowling Green', 'BOWLING_GREEN_NCAAF'),
  ('bowling_green_ncaab', 'Bowling Green Falcons', 'Bowling Green', 'NCAAB', 'BASKETBALL', 'ncaaf/Bowling Green', 'BOWLING_GREEN_NCAAB'),
  -- Buffalo
  ('buffalo_ncaaf', 'Buffalo Bulls', 'Buffalo', 'NCAAF', 'FOOTBALL', 'ncaaf/Buffalo', 'BUFFALO_NCAAF'),
  ('buffalo_ncaab', 'Buffalo Bulls', 'Buffalo', 'NCAAB', 'BASKETBALL', 'ncaaf/Buffalo', 'BUFFALO_NCAAB'),
  -- BYU
  ('byu_ncaaf', 'BYU Cougars', 'Provo', 'NCAAF', 'FOOTBALL', 'ncaaf/BYU', 'BYU_NCAAF'),
  ('byu_ncaab', 'BYU Cougars', 'Provo', 'NCAAB', 'BASKETBALL', 'ncaaf/BYU', 'BYU_NCAAB'),
  -- California
  ('california_ncaaf', 'California Golden Bears', 'Berkeley', 'NCAAF', 'FOOTBALL', 'ncaaf/California', 'CALIFORNIA_NCAAF'),
  ('california_ncaab', 'California Golden Bears', 'Berkeley', 'NCAAB', 'BASKETBALL', 'ncaaf/California', 'CALIFORNIA_NCAAB'),
  -- Central Michigan
  ('central_michigan_ncaaf', 'Central Michigan Chippewas', 'Mount Pleasant', 'NCAAF', 'FOOTBALL', 'ncaaf/Central Michigan', 'CENTRAL_MICHIGAN_NCAAF'),
  ('central_michigan_ncaab', 'Central Michigan Chippewas', 'Mount Pleasant', 'NCAAB', 'BASKETBALL', 'ncaaf/Central Michigan', 'CENTRAL_MICHIGAN_NCAAB'),
  -- Charlotte
  ('charlotte_ncaaf', 'Charlotte 49ers', 'Charlotte', 'NCAAF', 'FOOTBALL', 'ncaaf/Charlotte', 'CHARLOTTE_NCAAF'),
  ('charlotte_ncaab', 'Charlotte 49ers', 'Charlotte', 'NCAAB', 'BASKETBALL', 'ncaaf/Charlotte', 'CHARLOTTE_NCAAB'),
  -- Cincinnati
  ('cincinnati_ncaaf', 'Cincinnati Bearcats', 'Cincinnati', 'NCAAF', 'FOOTBALL', 'ncaaf/Cincinnati', 'CINCINNATI_NCAAF'),
  ('cincinnati_ncaab', 'Cincinnati Bearcats', 'Cincinnati', 'NCAAB', 'BASKETBALL', 'ncaaf/Cincinnati', 'CINCINNATI_NCAAB'),
  -- Clemson
  ('clemson_ncaaf', 'Clemson Tigers', 'Clemson', 'NCAAF', 'FOOTBALL', 'ncaaf/Clemson', 'CLEMSON_NCAAF'),
  ('clemson_ncaab', 'Clemson Tigers', 'Clemson', 'NCAAB', 'BASKETBALL', 'ncaaf/Clemson', 'CLEMSON_NCAAB'),
  -- Coastal Carolina
  ('coastal_carolina_ncaaf', 'Coastal Carolina Chanticleers', 'Conway', 'NCAAF', 'FOOTBALL', 'ncaaf/Coastal Carolina', 'COASTAL_CAROLINA_NCAAF'),
  ('coastal_carolina_ncaab', 'Coastal Carolina Chanticleers', 'Conway', 'NCAAB', 'BASKETBALL', 'ncaaf/Coastal Carolina', 'COASTAL_CAROLINA_NCAAB'),
  -- Colorado
  ('colorado_ncaaf', 'Colorado Buffaloes', 'Boulder', 'NCAAF', 'FOOTBALL', 'ncaaf/Colorado', 'COLORADO_NCAAF'),
  ('colorado_ncaab', 'Colorado Buffaloes', 'Boulder', 'NCAAB', 'BASKETBALL', 'ncaaf/Colorado', 'COLORADO_NCAAB'),
  -- Colorado State
  ('colorado_state_ncaaf', 'Colorado State Rams', 'Fort Collins', 'NCAAF', 'FOOTBALL', 'ncaaf/Colorado State', 'COLORADO_STATE_NCAAF'),
  ('colorado_state_ncaab', 'Colorado State Rams', 'Fort Collins', 'NCAAB', 'BASKETBALL', 'ncaaf/Colorado State', 'COLORADO_STATE_NCAAB'),
  -- Duke
  ('duke_ncaaf', 'Duke Blue Devils', 'Durham', 'NCAAF', 'FOOTBALL', 'ncaaf/Duke', 'DUKE_NCAAF'),
  ('duke_ncaab', 'Duke Blue Devils', 'Durham', 'NCAAB', 'BASKETBALL', 'ncaaf/Duke', 'DUKE_NCAAB'),
  -- East Carolina
  ('east_carolina_ncaaf', 'East Carolina Pirates', 'Greenville', 'NCAAF', 'FOOTBALL', 'ncaaf/East Carolina', 'EAST_CAROLINA_NCAAF'),
  ('east_carolina_ncaab', 'East Carolina Pirates', 'Greenville', 'NCAAB', 'BASKETBALL', 'ncaaf/East Carolina', 'EAST_CAROLINA_NCAAB'),
  -- Eastern Michigan
  ('eastern_michigan_ncaaf', 'Eastern Michigan Eagles', 'Ypsilanti', 'NCAAF', 'FOOTBALL', 'ncaaf/Eastern Michigan', 'EASTERN_MICHIGAN_NCAAF'),
  ('eastern_michigan_ncaab', 'Eastern Michigan Eagles', 'Ypsilanti', 'NCAAB', 'BASKETBALL', 'ncaaf/Eastern Michigan', 'EASTERN_MICHIGAN_NCAAB'),
  -- FIU
  ('fiu_ncaaf', 'FIU Panthers', 'Miami', 'NCAAF', 'FOOTBALL', 'ncaaf/FIU', 'FIU_NCAAF'),
  ('fiu_ncaab', 'FIU Panthers', 'Miami', 'NCAAB', 'BASKETBALL', 'ncaaf/FIU', 'FIU_NCAAB'),
  -- Florida
  ('florida_ncaaf', 'Florida Gators', 'Gainesville', 'NCAAF', 'FOOTBALL', 'ncaaf/Florida', 'FLORIDA_NCAAF'),
  ('florida_ncaab', 'Florida Gators', 'Gainesville', 'NCAAB', 'BASKETBALL', 'ncaaf/Florida', 'FLORIDA_NCAAB'),
  -- Florida Atlantic
  ('florida_atlantic_ncaaf', 'Florida Atlantic Owls', 'Boca Raton', 'NCAAF', 'FOOTBALL', 'ncaaf/Florida Atlantic', 'FLORIDA_ATLANTIC_NCAAF'),
  ('florida_atlantic_ncaab', 'Florida Atlantic Owls', 'Boca Raton', 'NCAAB', 'BASKETBALL', 'ncaaf/Florida Atlantic', 'FLORIDA_ATLANTIC_NCAAB'),
  -- Florida State
  ('florida_state_ncaaf', 'Florida State Seminoles', 'Tallahassee', 'NCAAF', 'FOOTBALL', 'ncaaf/Florida State', 'FLORIDA_STATE_NCAAF'),
  ('florida_state_ncaab', 'Florida State Seminoles', 'Tallahassee', 'NCAAB', 'BASKETBALL', 'ncaaf/Florida State', 'FLORIDA_STATE_NCAAB'),
  -- Fresno State
  ('fresno_state_ncaaf', 'Fresno State Bulldogs', 'Fresno', 'NCAAF', 'FOOTBALL', 'ncaaf/Fresno State', 'FRESNO_STATE_NCAAF'),
  ('fresno_state_ncaab', 'Fresno State Bulldogs', 'Fresno', 'NCAAB', 'BASKETBALL', 'ncaaf/Fresno State', 'FRESNO_STATE_NCAAB'),
  -- Georgia
  ('georgia_ncaaf', 'Georgia Bulldogs', 'Athens', 'NCAAF', 'FOOTBALL', 'ncaaf/Georgia', 'GEORGIA_NCAAF'),
  ('georgia_ncaab', 'Georgia Bulldogs', 'Athens', 'NCAAB', 'BASKETBALL', 'ncaaf/Georgia', 'GEORGIA_NCAAB'),
  -- Georgia Southern
  ('georgia_southern_ncaaf', 'Georgia Southern Eagles', 'Statesboro', 'NCAAF', 'FOOTBALL', 'ncaaf/Georgia Southern', 'GEORGIA_SOUTHERN_NCAAF'),
  ('georgia_southern_ncaab', 'Georgia Southern Eagles', 'Statesboro', 'NCAAB', 'BASKETBALL', 'ncaaf/Georgia Southern', 'GEORGIA_SOUTHERN_NCAAB'),
  -- Georgia State
  ('georgia_state_ncaaf', 'Georgia State Panthers', 'Atlanta', 'NCAAF', 'FOOTBALL', 'ncaaf/Georgia State', 'GEORGIA_STATE_NCAAF'),
  ('georgia_state_ncaab', 'Georgia State Panthers', 'Atlanta', 'NCAAB', 'BASKETBALL', 'ncaaf/Georgia State', 'GEORGIA_STATE_NCAAB'),
  -- Georgia Tech
  ('georgia_tech_ncaaf', 'Georgia Tech Yellow Jackets', 'Atlanta', 'NCAAF', 'FOOTBALL', 'ncaaf/Georgia Tech', 'GEORGIA_TECH_NCAAF'),
  ('georgia_tech_ncaab', 'Georgia Tech Yellow Jackets', 'Atlanta', 'NCAAB', 'BASKETBALL', 'ncaaf/Georgia Tech', 'GEORGIA_TECH_NCAAB'),
  -- Hawaii
  ('hawaii_ncaaf', 'Hawaii Rainbow Warriors', 'Honolulu', 'NCAAF', 'FOOTBALL', 'ncaaf/Hawaii', 'HAWAII_NCAAF'),
  ('hawaii_ncaab', 'Hawaii Rainbow Warriors', 'Honolulu', 'NCAAB', 'BASKETBALL', 'ncaaf/Hawaii', 'HAWAII_NCAAB'),
  -- Houston
  ('houston_ncaaf', 'Houston Cougars', 'Houston', 'NCAAF', 'FOOTBALL', 'ncaaf/Houston', 'HOUSTON_NCAAF'),
  ('houston_ncaab', 'Houston Cougars', 'Houston', 'NCAAB', 'BASKETBALL', 'ncaaf/Houston', 'HOUSTON_NCAAB'),
  -- Illinois
  ('illinois_ncaaf', 'Illinois Fighting Illini', 'Champaign', 'NCAAF', 'FOOTBALL', 'ncaaf/Illinois', 'ILLINOIS_NCAAF'),
  ('illinois_ncaab', 'Illinois Fighting Illini', 'Champaign', 'NCAAB', 'BASKETBALL', 'ncaaf/Illinois', 'ILLINOIS_NCAAB'),
  -- Indiana
  ('indiana_ncaaf', 'Indiana Hoosiers', 'Bloomington', 'NCAAF', 'FOOTBALL', 'ncaaf/Indiana', 'INDIANA_NCAAF'),
  ('indiana_ncaab', 'Indiana Hoosiers', 'Bloomington', 'NCAAB', 'BASKETBALL', 'ncaaf/Indiana', 'INDIANA_NCAAB'),
  -- Iowa
  ('iowa_ncaaf', 'Iowa Hawkeyes', 'Iowa City', 'NCAAF', 'FOOTBALL', 'ncaaf/Iowa', 'IOWA_NCAAF'),
  ('iowa_ncaab', 'Iowa Hawkeyes', 'Iowa City', 'NCAAB', 'BASKETBALL', 'ncaaf/Iowa', 'IOWA_NCAAB'),
  -- Iowa State
  ('iowa_state_ncaaf', 'Iowa State Cyclones', 'Ames', 'NCAAF', 'FOOTBALL', 'ncaaf/Iowa State', 'IOWA_STATE_NCAAF'),
  ('iowa_state_ncaab', 'Iowa State Cyclones', 'Ames', 'NCAAB', 'BASKETBALL', 'ncaaf/Iowa State', 'IOWA_STATE_NCAAB'),
  -- Jacksonville State
  ('jacksonville_state_ncaaf', 'Jacksonville State Gamecocks', 'Jacksonville', 'NCAAF', 'FOOTBALL', 'ncaaf/Jacksonville State', 'JACKSONVILLE_STATE_NCAAF'),
  ('jacksonville_state_ncaab', 'Jacksonville State Gamecocks', 'Jacksonville', 'NCAAB', 'BASKETBALL', 'ncaaf/Jacksonville State', 'JACKSONVILLE_STATE_NCAAB'),
  -- James Madison
  ('james_madison_ncaaf', 'James Madison Dukes', 'Harrisonburg', 'NCAAF', 'FOOTBALL', 'ncaaf/James Madison', 'JAMES_MADISON_NCAAF'),
  ('james_madison_ncaab', 'James Madison Dukes', 'Harrisonburg', 'NCAAB', 'BASKETBALL', 'ncaaf/James Madison', 'JAMES_MADISON_NCAAB'),
  -- Kansas
  ('kansas_ncaaf', 'Kansas Jayhawks', 'Lawrence', 'NCAAF', 'FOOTBALL', 'ncaaf/Kansas', 'KANSAS_NCAAF'),
  ('kansas_ncaab', 'Kansas Jayhawks', 'Lawrence', 'NCAAB', 'BASKETBALL', 'ncaaf/Kansas', 'KANSAS_NCAAB'),
  -- Kansas State
  ('kansas_state_ncaaf', 'Kansas State Wildcats', 'Manhattan', 'NCAAF', 'FOOTBALL', 'ncaaf/Kansas State', 'KANSAS_STATE_NCAAF'),
  ('kansas_state_ncaab', 'Kansas State Wildcats', 'Manhattan', 'NCAAB', 'BASKETBALL', 'ncaaf/Kansas State', 'KANSAS_STATE_NCAAB'),
  -- Kent State
  ('kent_state_ncaaf', 'Kent State Golden Flashes', 'Kent', 'NCAAF', 'FOOTBALL', 'ncaaf/Kent State', 'KENT_STATE_NCAAF'),
  ('kent_state_ncaab', 'Kent State Golden Flashes', 'Kent', 'NCAAB', 'BASKETBALL', 'ncaaf/Kent State', 'KENT_STATE_NCAAB'),
  -- Kentucky
  ('kentucky_ncaaf', 'Kentucky Wildcats', 'Lexington', 'NCAAF', 'FOOTBALL', 'ncaaf/Kentucky', 'KENTUCKY_NCAAF'),
  ('kentucky_ncaab', 'Kentucky Wildcats', 'Lexington', 'NCAAB', 'BASKETBALL', 'ncaaf/Kentucky', 'KENTUCKY_NCAAB'),
  -- Liberty
  ('liberty_ncaaf', 'Liberty Flames', 'Lynchburg', 'NCAAF', 'FOOTBALL', 'ncaaf/Liberty', 'LIBERTY_NCAAF'),
  ('liberty_ncaab', 'Liberty Flames', 'Lynchburg', 'NCAAB', 'BASKETBALL', 'ncaaf/Liberty', 'LIBERTY_NCAAB'),
  -- Louisiana
  ('louisiana_ncaaf', 'Louisiana Ragin Cajuns', 'Lafayette', 'NCAAF', 'FOOTBALL', 'ncaaf/Louisiana', 'LOUISIANA_NCAAF'),
  ('louisiana_ncaab', 'Louisiana Ragin Cajuns', 'Lafayette', 'NCAAB', 'BASKETBALL', 'ncaaf/Louisiana', 'LOUISIANA_NCAAB'),
  -- Louisiana Tech
  ('louisiana_tech_ncaaf', 'Louisiana Tech Bulldogs', 'Ruston', 'NCAAF', 'FOOTBALL', 'ncaaf/Louisiana Tech', 'LOUISIANA_TECH_NCAAF'),
  ('louisiana_tech_ncaab', 'Louisiana Tech Bulldogs', 'Ruston', 'NCAAB', 'BASKETBALL', 'ncaaf/Louisiana Tech', 'LOUISIANA_TECH_NCAAB'),
  -- Louisville
  ('louisville_ncaaf', 'Louisville Cardinals', 'Louisville', 'NCAAF', 'FOOTBALL', 'ncaaf/Louisville', 'LOUISVILLE_NCAAF'),
  ('louisville_ncaab', 'Louisville Cardinals', 'Louisville', 'NCAAB', 'BASKETBALL', 'ncaaf/Louisville', 'LOUISVILLE_NCAAB'),
  -- LSU
  ('lsu_ncaaf', 'LSU Tigers', 'Baton Rouge', 'NCAAF', 'FOOTBALL', 'ncaaf/LSU', 'LSU_NCAAF'),
  ('lsu_ncaab', 'LSU Tigers', 'Baton Rouge', 'NCAAB', 'BASKETBALL', 'ncaaf/LSU', 'LSU_NCAAB'),
  -- Marshall
  ('marshall_ncaaf', 'Marshall Thundering Herd', 'Huntington', 'NCAAF', 'FOOTBALL', 'ncaaf/Marshall', 'MARSHALL_NCAAF'),
  ('marshall_ncaab', 'Marshall Thundering Herd', 'Huntington', 'NCAAB', 'BASKETBALL', 'ncaaf/Marshall', 'MARSHALL_NCAAB'),
  -- Maryland
  ('maryland_ncaaf', 'Maryland Terrapins', 'College Park', 'NCAAF', 'FOOTBALL', 'ncaaf/Maryland', 'MARYLAND_NCAAF'),
  ('maryland_ncaab', 'Maryland Terrapins', 'College Park', 'NCAAB', 'BASKETBALL', 'ncaaf/Maryland', 'MARYLAND_NCAAB'),
  -- Memphis
  ('memphis_ncaaf', 'Memphis Tigers', 'Memphis', 'NCAAF', 'FOOTBALL', 'ncaaf/Memphis', 'MEMPHIS_NCAAF'),
  ('memphis_ncaab', 'Memphis Tigers', 'Memphis', 'NCAAB', 'BASKETBALL', 'ncaaf/Memphis', 'MEMPHIS_NCAAB'),
  -- Miami
  ('miami_ncaaf', 'Miami Hurricanes', 'Coral Gables', 'NCAAF', 'FOOTBALL', 'ncaaf/Miami', 'MIAMI_NCAAF'),
  ('miami_ncaab', 'Miami Hurricanes', 'Coral Gables', 'NCAAB', 'BASKETBALL', 'ncaaf/Miami', 'MIAMI_NCAAB'),
  -- Miami (OH)
  ('miami_oh_ncaaf', 'Miami (OH) RedHawks', 'Oxford', 'NCAAF', 'FOOTBALL', 'ncaaf/Miami (OH)', 'MIAMI_OH_NCAAF'),
  ('miami_oh_ncaab', 'Miami (OH) RedHawks', 'Oxford', 'NCAAB', 'BASKETBALL', 'ncaaf/Miami (OH)', 'MIAMI_OH_NCAAB'),
  -- Michigan
  ('michigan_ncaaf', 'Michigan Wolverines', 'Ann Arbor', 'NCAAF', 'FOOTBALL', 'ncaaf/Michigan', 'MICHIGAN_NCAAF'),
  ('michigan_ncaab', 'Michigan Wolverines', 'Ann Arbor', 'NCAAB', 'BASKETBALL', 'ncaaf/Michigan', 'MICHIGAN_NCAAB'),
  -- Michigan State
  ('michigan_state_ncaaf', 'Michigan State Spartans', 'East Lansing', 'NCAAF', 'FOOTBALL', 'ncaaf/Michigan State', 'MICHIGAN_STATE_NCAAF'),
  ('michigan_state_ncaab', 'Michigan State Spartans', 'East Lansing', 'NCAAB', 'BASKETBALL', 'ncaaf/Michigan State', 'MICHIGAN_STATE_NCAAB'),
  -- Middle Tennessee
  ('middle_tennessee_ncaaf', 'Middle Tennessee Blue Raiders', 'Murfreesboro', 'NCAAF', 'FOOTBALL', 'ncaaf/Middle Tennessee', 'MIDDLE_TENNESSEE_NCAAF'),
  ('middle_tennessee_ncaab', 'Middle Tennessee Blue Raiders', 'Murfreesboro', 'NCAAB', 'BASKETBALL', 'ncaaf/Middle Tennessee', 'MIDDLE_TENNESSEE_NCAAB'),
  -- Minnesota
  ('minnesota_ncaaf', 'Minnesota Golden Gophers', 'Minneapolis', 'NCAAF', 'FOOTBALL', 'ncaaf/Minnesota', 'MINNESOTA_NCAAF'),
  ('minnesota_ncaab', 'Minnesota Golden Gophers', 'Minneapolis', 'NCAAB', 'BASKETBALL', 'ncaaf/Minnesota', 'MINNESOTA_NCAAB'),
  -- Mississippi State
  ('mississippi_state_ncaaf', 'Mississippi State Bulldogs', 'Starkville', 'NCAAF', 'FOOTBALL', 'ncaaf/Mississippi State', 'MISSISSIPPI_STATE_NCAAF'),
  ('mississippi_state_ncaab', 'Mississippi State Bulldogs', 'Starkville', 'NCAAB', 'BASKETBALL', 'ncaaf/Mississippi State', 'MISSISSIPPI_STATE_NCAAB'),
  -- Missouri
  ('missouri_ncaaf', 'Missouri Tigers', 'Columbia', 'NCAAF', 'FOOTBALL', 'ncaaf/Missouri', 'MISSOURI_NCAAF'),
  ('missouri_ncaab', 'Missouri Tigers', 'Columbia', 'NCAAB', 'BASKETBALL', 'ncaaf/Missouri', 'MISSOURI_NCAAB'),
  -- Navy
  ('navy_ncaaf', 'Navy Midshipmen', 'Annapolis', 'NCAAF', 'FOOTBALL', 'ncaaf/Navy', 'NAVY_NCAAF'),
  ('navy_ncaab', 'Navy Midshipmen', 'Annapolis', 'NCAAB', 'BASKETBALL', 'ncaaf/Navy', 'NAVY_NCAAB'),
  -- NC State
  ('nc_state_ncaaf', 'NC State Wolfpack', 'Raleigh', 'NCAAF', 'FOOTBALL', 'ncaaf/NC State', 'NC_STATE_NCAAF'),
  ('nc_state_ncaab', 'NC State Wolfpack', 'Raleigh', 'NCAAB', 'BASKETBALL', 'ncaaf/NC State', 'NC_STATE_NCAAB'),
  -- Nebraska
  ('nebraska_ncaaf', 'Nebraska Cornhuskers', 'Lincoln', 'NCAAF', 'FOOTBALL', 'ncaaf/Nebraska', 'NEBRASKA_NCAAF'),
  ('nebraska_ncaab', 'Nebraska Cornhuskers', 'Lincoln', 'NCAAB', 'BASKETBALL', 'ncaaf/Nebraska', 'NEBRASKA_NCAAB'),
  -- Nevada
  ('nevada_ncaaf', 'Nevada Wolf Pack', 'Reno', 'NCAAF', 'FOOTBALL', 'ncaaf/Nevada', 'NEVADA_NCAAF'),
  ('nevada_ncaab', 'Nevada Wolf Pack', 'Reno', 'NCAAB', 'BASKETBALL', 'ncaaf/Nevada', 'NEVADA_NCAAB'),
  -- New Mexico
  ('new_mexico_ncaaf', 'New Mexico Lobos', 'Albuquerque', 'NCAAF', 'FOOTBALL', 'ncaaf/New Mexico', 'NEW_MEXICO_NCAAF'),
  ('new_mexico_ncaab', 'New Mexico Lobos', 'Albuquerque', 'NCAAB', 'BASKETBALL', 'ncaaf/New Mexico', 'NEW_MEXICO_NCAAB'),
  -- New Mexico State
  ('new_mexico_state_ncaaf', 'New Mexico State Aggies', 'Las Cruces', 'NCAAF', 'FOOTBALL', 'ncaaf/New Mexico State', 'NEW_MEXICO_STATE_NCAAF'),
  ('new_mexico_state_ncaab', 'New Mexico State Aggies', 'Las Cruces', 'NCAAB', 'BASKETBALL', 'ncaaf/New Mexico State', 'NEW_MEXICO_STATE_NCAAB'),
  -- North Carolina
  ('north_carolina_ncaaf', 'North Carolina Tar Heels', 'Chapel Hill', 'NCAAF', 'FOOTBALL', 'ncaaf/North Carolina', 'NORTH_CAROLINA_NCAAF'),
  ('north_carolina_ncaab', 'North Carolina Tar Heels', 'Chapel Hill', 'NCAAB', 'BASKETBALL', 'ncaaf/North Carolina', 'NORTH_CAROLINA_NCAAB'),
  -- North Texas
  ('north_texas_ncaaf', 'North Texas Mean Green', 'Denton', 'NCAAF', 'FOOTBALL', 'ncaaf/North Texas', 'NORTH_TEXAS_NCAAF'),
  ('north_texas_ncaab', 'North Texas Mean Green', 'Denton', 'NCAAB', 'BASKETBALL', 'ncaaf/North Texas', 'NORTH_TEXAS_NCAAB'),
  -- Northern Illinois
  ('northern_illinois_ncaaf', 'Northern Illinois Huskies', 'DeKalb', 'NCAAF', 'FOOTBALL', 'ncaaf/Northern Illinois', 'NORTHERN_ILLINOIS_NCAAF'),
  ('northern_illinois_ncaab', 'Northern Illinois Huskies', 'DeKalb', 'NCAAB', 'BASKETBALL', 'ncaaf/Northern Illinois', 'NORTHERN_ILLINOIS_NCAAB'),
  -- Northwestern
  ('northwestern_ncaaf', 'Northwestern Wildcats', 'Evanston', 'NCAAF', 'FOOTBALL', 'ncaaf/Northwestern', 'NORTHWESTERN_NCAAF'),
  ('northwestern_ncaab', 'Northwestern Wildcats', 'Evanston', 'NCAAB', 'BASKETBALL', 'ncaaf/Northwestern', 'NORTHWESTERN_NCAAB'),
  -- Notre Dame
  ('notre_dame_ncaaf', 'Notre Dame Fighting Irish', 'South Bend', 'NCAAF', 'FOOTBALL', 'ncaaf/Notre Dame', 'NOTRE_DAME_NCAAF'),
  ('notre_dame_ncaab', 'Notre Dame Fighting Irish', 'South Bend', 'NCAAB', 'BASKETBALL', 'ncaaf/Notre Dame', 'NOTRE_DAME_NCAAB'),
  -- Ohio
  ('ohio_ncaaf', 'Ohio Bobcats', 'Athens', 'NCAAF', 'FOOTBALL', 'ncaaf/Ohio', 'OHIO_NCAAF'),
  ('ohio_ncaab', 'Ohio Bobcats', 'Athens', 'NCAAB', 'BASKETBALL', 'ncaaf/Ohio', 'OHIO_NCAAB'),
  -- Ohio State
  ('ohio_state_ncaaf', 'Ohio State Buckeyes', 'Columbus', 'NCAAF', 'FOOTBALL', 'ncaaf/Ohio State', 'OHIO_STATE_NCAAF'),
  ('ohio_state_ncaab', 'Ohio State Buckeyes', 'Columbus', 'NCAAB', 'BASKETBALL', 'ncaaf/Ohio State', 'OHIO_STATE_NCAAB'),
  -- Oklahoma
  ('oklahoma_ncaaf', 'Oklahoma Sooners', 'Norman', 'NCAAF', 'FOOTBALL', 'ncaaf/Oklahoma', 'OKLAHOMA_NCAAF'),
  ('oklahoma_ncaab', 'Oklahoma Sooners', 'Norman', 'NCAAB', 'BASKETBALL', 'ncaaf/Oklahoma', 'OKLAHOMA_NCAAB'),
  -- Oklahoma State
  ('oklahoma_state_ncaaf', 'Oklahoma State Cowboys', 'Stillwater', 'NCAAF', 'FOOTBALL', 'ncaaf/Oklahoma State', 'OKLAHOMA_STATE_NCAAF'),
  ('oklahoma_state_ncaab', 'Oklahoma State Cowboys', 'Stillwater', 'NCAAB', 'BASKETBALL', 'ncaaf/Oklahoma State', 'OKLAHOMA_STATE_NCAAB'),
  -- Old Dominion
  ('old_dominion_ncaaf', 'Old Dominion Monarchs', 'Norfolk', 'NCAAF', 'FOOTBALL', 'ncaaf/Old Dominion', 'OLD_DOMINION_NCAAF'),
  ('old_dominion_ncaab', 'Old Dominion Monarchs', 'Norfolk', 'NCAAB', 'BASKETBALL', 'ncaaf/Old Dominion', 'OLD_DOMINION_NCAAB'),
  -- Ole Miss
  ('ole_miss_ncaaf', 'Ole Miss Rebels', 'Oxford', 'NCAAF', 'FOOTBALL', 'ncaaf/Ole Miss', 'OLE_MISS_NCAAF'),
  ('ole_miss_ncaab', 'Ole Miss Rebels', 'Oxford', 'NCAAB', 'BASKETBALL', 'ncaaf/Ole Miss', 'OLE_MISS_NCAAB'),
  -- Oregon
  ('oregon_ncaaf', 'Oregon Ducks', 'Eugene', 'NCAAF', 'FOOTBALL', 'ncaaf/Oregon', 'OREGON_NCAAF'),
  ('oregon_ncaab', 'Oregon Ducks', 'Eugene', 'NCAAB', 'BASKETBALL', 'ncaaf/Oregon', 'OREGON_NCAAB'),
  -- Oregon State
  ('oregon_state_ncaaf', 'Oregon State Beavers', 'Corvallis', 'NCAAF', 'FOOTBALL', 'ncaaf/Oregon State', 'OREGON_STATE_NCAAF'),
  ('oregon_state_ncaab', 'Oregon State Beavers', 'Corvallis', 'NCAAB', 'BASKETBALL', 'ncaaf/Oregon State', 'OREGON_STATE_NCAAB'),
  -- Penn State
  ('penn_state_ncaaf', 'Penn State Nittany Lions', 'State College', 'NCAAF', 'FOOTBALL', 'ncaaf/Penn State', 'PENN_STATE_NCAAF'),
  ('penn_state_ncaab', 'Penn State Nittany Lions', 'State College', 'NCAAB', 'BASKETBALL', 'ncaaf/Penn State', 'PENN_STATE_NCAAB'),
  -- Pittsburgh
  ('pittsburgh_ncaaf', 'Pittsburgh Panthers', 'Pittsburgh', 'NCAAF', 'FOOTBALL', 'ncaaf/Pittsburgh', 'PITTSBURGH_NCAAF'),
  ('pittsburgh_ncaab', 'Pittsburgh Panthers', 'Pittsburgh', 'NCAAB', 'BASKETBALL', 'ncaaf/Pittsburgh', 'PITTSBURGH_NCAAB'),
  -- Purdue
  ('purdue_ncaaf', 'Purdue Boilermakers', 'West Lafayette', 'NCAAF', 'FOOTBALL', 'ncaaf/Purdue', 'PURDUE_NCAAF'),
  ('purdue_ncaab', 'Purdue Boilermakers', 'West Lafayette', 'NCAAB', 'BASKETBALL', 'ncaaf/Purdue', 'PURDUE_NCAAB'),
  -- Rice
  ('rice_ncaaf', 'Rice Owls', 'Houston', 'NCAAF', 'FOOTBALL', 'ncaaf/Rice', 'RICE_NCAAF'),
  ('rice_ncaab', 'Rice Owls', 'Houston', 'NCAAB', 'BASKETBALL', 'ncaaf/Rice', 'RICE_NCAAB'),
  -- Rutgers
  ('rutgers_ncaaf', 'Rutgers Scarlet Knights', 'Piscataway', 'NCAAF', 'FOOTBALL', 'ncaaf/Rutgers', 'RUTGERS_NCAAF'),
  ('rutgers_ncaab', 'Rutgers Scarlet Knights', 'Piscataway', 'NCAAB', 'BASKETBALL', 'ncaaf/Rutgers', 'RUTGERS_NCAAB'),
  -- Sam Houston
  ('sam_houston_ncaaf', 'Sam Houston Bearkats', 'Huntsville', 'NCAAF', 'FOOTBALL', 'ncaaf/Sam Houston', 'SAM_HOUSTON_NCAAF'),
  ('sam_houston_ncaab', 'Sam Houston Bearkats', 'Huntsville', 'NCAAB', 'BASKETBALL', 'ncaaf/Sam Houston', 'SAM_HOUSTON_NCAAB'),
  -- San Diego State
  ('san_diego_state_ncaaf', 'San Diego State Aztecs', 'San Diego', 'NCAAF', 'FOOTBALL', 'ncaaf/San Diego State', 'SAN_DIEGO_STATE_NCAAF'),
  ('san_diego_state_ncaab', 'San Diego State Aztecs', 'San Diego', 'NCAAB', 'BASKETBALL', 'ncaaf/San Diego State', 'SAN_DIEGO_STATE_NCAAB'),
  -- San Jose State
  ('san_jose_state_ncaaf', 'San Jose State Spartans', 'San Jose', 'NCAAF', 'FOOTBALL', 'ncaaf/San Jose State', 'SAN_JOSE_STATE_NCAAF'),
  ('san_jose_state_ncaab', 'San Jose State Spartans', 'San Jose', 'NCAAB', 'BASKETBALL', 'ncaaf/San Jose State', 'SAN_JOSE_STATE_NCAAB'),
  -- SMU
  ('smu_ncaaf', 'SMU Mustangs', 'Dallas', 'NCAAF', 'FOOTBALL', 'ncaaf/SMU', 'SMU_NCAAF'),
  ('smu_ncaab', 'SMU Mustangs', 'Dallas', 'NCAAB', 'BASKETBALL', 'ncaaf/SMU', 'SMU_NCAAB'),
  -- South Alabama
  ('south_alabama_ncaaf', 'South Alabama Jaguars', 'Mobile', 'NCAAF', 'FOOTBALL', 'ncaaf/South Alabama', 'SOUTH_ALABAMA_NCAAF'),
  ('south_alabama_ncaab', 'South Alabama Jaguars', 'Mobile', 'NCAAB', 'BASKETBALL', 'ncaaf/South Alabama', 'SOUTH_ALABAMA_NCAAB'),
  -- South Carolina
  ('south_carolina_ncaaf', 'South Carolina Gamecocks', 'Columbia', 'NCAAF', 'FOOTBALL', 'ncaaf/South Carolina', 'SOUTH_CAROLINA_NCAAF'),
  ('south_carolina_ncaab', 'South Carolina Gamecocks', 'Columbia', 'NCAAB', 'BASKETBALL', 'ncaaf/South Carolina', 'SOUTH_CAROLINA_NCAAB'),
  -- South Florida
  ('south_florida_ncaaf', 'South Florida Bulls', 'Tampa', 'NCAAF', 'FOOTBALL', 'ncaaf/South Florida', 'SOUTH_FLORIDA_NCAAF'),
  ('south_florida_ncaab', 'South Florida Bulls', 'Tampa', 'NCAAB', 'BASKETBALL', 'ncaaf/South Florida', 'SOUTH_FLORIDA_NCAAB'),
  -- Southern Miss
  ('southern_miss_ncaaf', 'Southern Miss Golden Eagles', 'Hattiesburg', 'NCAAF', 'FOOTBALL', 'ncaaf/Southern Miss', 'SOUTHERN_MISS_NCAAF'),
  ('southern_miss_ncaab', 'Southern Miss Golden Eagles', 'Hattiesburg', 'NCAAB', 'BASKETBALL', 'ncaaf/Southern Miss', 'SOUTHERN_MISS_NCAAB'),
  -- Stanford
  ('stanford_ncaaf', 'Stanford Cardinal', 'Stanford', 'NCAAF', 'FOOTBALL', 'ncaaf/Stanford', 'STANFORD_NCAAF'),
  ('stanford_ncaab', 'Stanford Cardinal', 'Stanford', 'NCAAB', 'BASKETBALL', 'ncaaf/Stanford', 'STANFORD_NCAAB'),
  -- Syracuse
  ('syracuse_ncaaf', 'Syracuse Orange', 'Syracuse', 'NCAAF', 'FOOTBALL', 'ncaaf/Syracuse', 'SYRACUSE_NCAAF'),
  ('syracuse_ncaab', 'Syracuse Orange', 'Syracuse', 'NCAAB', 'BASKETBALL', 'ncaaf/Syracuse', 'SYRACUSE_NCAAB'),
  -- TCU
  ('tcu_ncaaf', 'TCU Horned Frogs', 'Fort Worth', 'NCAAF', 'FOOTBALL', 'ncaaf/TCU', 'TCU_NCAAF'),
  ('tcu_ncaab', 'TCU Horned Frogs', 'Fort Worth', 'NCAAB', 'BASKETBALL', 'ncaaf/TCU', 'TCU_NCAAB'),
  -- Temple
  ('temple_ncaaf', 'Temple Owls', 'Philadelphia', 'NCAAF', 'FOOTBALL', 'ncaaf/Temple', 'TEMPLE_NCAAF'),
  ('temple_ncaab', 'Temple Owls', 'Philadelphia', 'NCAAB', 'BASKETBALL', 'ncaaf/Temple', 'TEMPLE_NCAAB'),
  -- Tennessee
  ('tennessee_ncaaf', 'Tennessee Volunteers', 'Knoxville', 'NCAAF', 'FOOTBALL', 'ncaaf/Tennessee', 'TENNESSEE_NCAAF'),
  ('tennessee_ncaab', 'Tennessee Volunteers', 'Knoxville', 'NCAAB', 'BASKETBALL', 'ncaaf/Tennessee', 'TENNESSEE_NCAAB'),
  -- Texas
  ('texas_ncaaf', 'Texas Longhorns', 'Austin', 'NCAAF', 'FOOTBALL', 'ncaaf/Texas', 'TEXAS_NCAAF'),
  ('texas_ncaab', 'Texas Longhorns', 'Austin', 'NCAAB', 'BASKETBALL', 'ncaaf/Texas', 'TEXAS_NCAAB'),
  -- Texas A&M
  ('texas_am_ncaaf', 'Texas A&M Aggies', 'College Station', 'NCAAF', 'FOOTBALL', 'ncaaf/Texas A&M', 'TEXAS_AM_NCAAF'),
  ('texas_am_ncaab', 'Texas A&M Aggies', 'College Station', 'NCAAB', 'BASKETBALL', 'ncaaf/Texas A&M', 'TEXAS_AM_NCAAB'),
  -- Texas State
  ('texas_state_ncaaf', 'Texas State Bobcats', 'San Marcos', 'NCAAF', 'FOOTBALL', 'ncaaf/Texas State', 'TEXAS_STATE_NCAAF'),
  ('texas_state_ncaab', 'Texas State Bobcats', 'San Marcos', 'NCAAB', 'BASKETBALL', 'ncaaf/Texas State', 'TEXAS_STATE_NCAAB'),
  -- Texas Tech
  ('texas_tech_ncaaf', 'Texas Tech Red Raiders', 'Lubbock', 'NCAAF', 'FOOTBALL', 'ncaaf/Texas Tech', 'TEXAS_TECH_NCAAF'),
  ('texas_tech_ncaab', 'Texas Tech Red Raiders', 'Lubbock', 'NCAAB', 'BASKETBALL', 'ncaaf/Texas Tech', 'TEXAS_TECH_NCAAB'),
  -- Toledo
  ('toledo_ncaaf', 'Toledo Rockets', 'Toledo', 'NCAAF', 'FOOTBALL', 'ncaaf/Toledo', 'TOLEDO_NCAAF'),
  ('toledo_ncaab', 'Toledo Rockets', 'Toledo', 'NCAAB', 'BASKETBALL', 'ncaaf/Toledo', 'TOLEDO_NCAAB'),
  -- Troy
  ('troy_ncaaf', 'Troy Trojans', 'Troy', 'NCAAF', 'FOOTBALL', 'ncaaf/Troy', 'TROY_NCAAF'),
  ('troy_ncaab', 'Troy Trojans', 'Troy', 'NCAAB', 'BASKETBALL', 'ncaaf/Troy', 'TROY_NCAAB'),
  -- Tulane
  ('tulane_ncaaf', 'Tulane Green Wave', 'New Orleans', 'NCAAF', 'FOOTBALL', 'ncaaf/Tulane', 'TULANE_NCAAF'),
  ('tulane_ncaab', 'Tulane Green Wave', 'New Orleans', 'NCAAB', 'BASKETBALL', 'ncaaf/Tulane', 'TULANE_NCAAB'),
  -- Tulsa
  ('tulsa_ncaaf', 'Tulsa Golden Hurricane', 'Tulsa', 'NCAAF', 'FOOTBALL', 'ncaaf/Tulsa', 'TULSA_NCAAF'),
  ('tulsa_ncaab', 'Tulsa Golden Hurricane', 'Tulsa', 'NCAAB', 'BASKETBALL', 'ncaaf/Tulsa', 'TULSA_NCAAB'),
  -- UAB
  ('uab_ncaaf', 'UAB Blazers', 'Birmingham', 'NCAAF', 'FOOTBALL', 'ncaaf/UAB', 'UAB_NCAAF'),
  ('uab_ncaab', 'UAB Blazers', 'Birmingham', 'NCAAB', 'BASKETBALL', 'ncaaf/UAB', 'UAB_NCAAB'),
  -- UCF
  ('ucf_ncaaf', 'UCF Knights', 'Orlando', 'NCAAF', 'FOOTBALL', 'ncaaf/UCF', 'UCF_NCAAF'),
  ('ucf_ncaab', 'UCF Knights', 'Orlando', 'NCAAB', 'BASKETBALL', 'ncaaf/UCF', 'UCF_NCAAB'),
  -- UCLA
  ('ucla_ncaaf', 'UCLA Bruins', 'Los Angeles', 'NCAAF', 'FOOTBALL', 'ncaaf/UCLA', 'UCLA_NCAAF'),
  ('ucla_ncaab', 'UCLA Bruins', 'Los Angeles', 'NCAAB', 'BASKETBALL', 'ncaaf/UCLA', 'UCLA_NCAAB'),
  -- UConn
  ('uconn_ncaaf', 'UConn Huskies', 'Storrs', 'NCAAF', 'FOOTBALL', 'ncaaf/UConn', 'UCONN_NCAAF'),
  ('uconn_ncaab', 'UConn Huskies', 'Storrs', 'NCAAB', 'BASKETBALL', 'ncaaf/UConn', 'UCONN_NCAAB'),
  -- UMass
  ('umass_ncaaf', 'UMass Minutemen', 'Amherst', 'NCAAF', 'FOOTBALL', 'ncaaf/UMass', 'UMASS_NCAAF'),
  ('umass_ncaab', 'UMass Minutemen', 'Amherst', 'NCAAB', 'BASKETBALL', 'ncaaf/UMass', 'UMASS_NCAAB'),
  -- UNLV
  ('unlv_ncaaf', 'UNLV Rebels', 'Las Vegas', 'NCAAF', 'FOOTBALL', 'ncaaf/UNLV', 'UNLV_NCAAF'),
  ('unlv_ncaab', 'UNLV Rebels', 'Las Vegas', 'NCAAB', 'BASKETBALL', 'ncaaf/UNLV', 'UNLV_NCAAB'),
  -- USC
  ('usc_ncaaf', 'USC Trojans', 'Los Angeles', 'NCAAF', 'FOOTBALL', 'ncaaf/USC', 'USC_NCAAF'),
  ('usc_ncaab', 'USC Trojans', 'Los Angeles', 'NCAAB', 'BASKETBALL', 'ncaaf/USC', 'USC_NCAAB'),
  -- Utah
  ('utah_ncaaf', 'Utah Utes', 'Salt Lake City', 'NCAAF', 'FOOTBALL', 'ncaaf/Utah', 'UTAH_NCAAF'),
  ('utah_ncaab', 'Utah Utes', 'Salt Lake City', 'NCAAB', 'BASKETBALL', 'ncaaf/Utah', 'UTAH_NCAAB'),
  -- Utah State
  ('utah_state_ncaaf', 'Utah State Aggies', 'Logan', 'NCAAF', 'FOOTBALL', 'ncaaf/Utah State', 'UTAH_STATE_NCAAF'),
  ('utah_state_ncaab', 'Utah State Aggies', 'Logan', 'NCAAB', 'BASKETBALL', 'ncaaf/Utah State', 'UTAH_STATE_NCAAB'),
  -- UTEP
  ('utep_ncaaf', 'UTEP Miners', 'El Paso', 'NCAAF', 'FOOTBALL', 'ncaaf/UTEP', 'UTEP_NCAAF'),
  ('utep_ncaab', 'UTEP Miners', 'El Paso', 'NCAAB', 'BASKETBALL', 'ncaaf/UTEP', 'UTEP_NCAAB'),
  -- UTSA
  ('utsa_ncaaf', 'UTSA Roadrunners', 'San Antonio', 'NCAAF', 'FOOTBALL', 'ncaaf/UTSA', 'UTSA_NCAAF'),
  ('utsa_ncaab', 'UTSA Roadrunners', 'San Antonio', 'NCAAB', 'BASKETBALL', 'ncaaf/UTSA', 'UTSA_NCAAB'),
  -- Vanderbilt
  ('vanderbilt_ncaaf', 'Vanderbilt Commodores', 'Nashville', 'NCAAF', 'FOOTBALL', 'ncaaf/Vanderbilt', 'VANDERBILT_NCAAF'),
  ('vanderbilt_ncaab', 'Vanderbilt Commodores', 'Nashville', 'NCAAB', 'BASKETBALL', 'ncaaf/Vanderbilt', 'VANDERBILT_NCAAB'),
  -- Virginia
  ('virginia_ncaaf', 'Virginia Cavaliers', 'Charlottesville', 'NCAAF', 'FOOTBALL', 'ncaaf/Virginia', 'VIRGINIA_NCAAF'),
  ('virginia_ncaab', 'Virginia Cavaliers', 'Charlottesville', 'NCAAB', 'BASKETBALL', 'ncaaf/Virginia', 'VIRGINIA_NCAAB'),
  -- Virginia Tech
  ('virginia_tech_ncaaf', 'Virginia Tech Hokies', 'Blacksburg', 'NCAAF', 'FOOTBALL', 'ncaaf/Virginia Tech', 'VIRGINIA_TECH_NCAAF'),
  ('virginia_tech_ncaab', 'Virginia Tech Hokies', 'Blacksburg', 'NCAAB', 'BASKETBALL', 'ncaaf/Virginia Tech', 'VIRGINIA_TECH_NCAAB'),
  -- Wake Forest
  ('wake_forest_ncaaf', 'Wake Forest Demon Deacons', 'Winston-Salem', 'NCAAF', 'FOOTBALL', 'ncaaf/Wake Forest', 'WAKE_FOREST_NCAAF'),
  ('wake_forest_ncaab', 'Wake Forest Demon Deacons', 'Winston-Salem', 'NCAAB', 'BASKETBALL', 'ncaaf/Wake Forest', 'WAKE_FOREST_NCAAB'),
  -- Washington
  ('washington_ncaaf', 'Washington Huskies', 'Seattle', 'NCAAF', 'FOOTBALL', 'ncaaf/Washington', 'WASHINGTON_NCAAF'),
  ('washington_ncaab', 'Washington Huskies', 'Seattle', 'NCAAB', 'BASKETBALL', 'ncaaf/Washington', 'WASHINGTON_NCAAB'),
  -- Washington State
  ('washington_state_ncaaf', 'Washington State Cougars', 'Pullman', 'NCAAF', 'FOOTBALL', 'ncaaf/Washington State', 'WASHINGTON_STATE_NCAAF'),
  ('washington_state_ncaab', 'Washington State Cougars', 'Pullman', 'NCAAB', 'BASKETBALL', 'ncaaf/Washington State', 'WASHINGTON_STATE_NCAAB'),
  -- West Virginia
  ('west_virginia_ncaaf', 'West Virginia Mountaineers', 'Morgantown', 'NCAAF', 'FOOTBALL', 'ncaaf/West Virginia', 'WEST_VIRGINIA_NCAAF'),
  ('west_virginia_ncaab', 'West Virginia Mountaineers', 'Morgantown', 'NCAAB', 'BASKETBALL', 'ncaaf/West Virginia', 'WEST_VIRGINIA_NCAAB'),
  -- Western Kentucky
  ('western_kentucky_ncaaf', 'Western Kentucky Hilltoppers', 'Bowling Green', 'NCAAF', 'FOOTBALL', 'ncaaf/Western Kentucky', 'WESTERN_KENTUCKY_NCAAF'),
  ('western_kentucky_ncaab', 'Western Kentucky Hilltoppers', 'Bowling Green', 'NCAAB', 'BASKETBALL', 'ncaaf/Western Kentucky', 'WESTERN_KENTUCKY_NCAAB'),
  -- Western Michigan
  ('western_michigan_ncaaf', 'Western Michigan Broncos', 'Kalamazoo', 'NCAAF', 'FOOTBALL', 'ncaaf/Western Michigan', 'WESTERN_MICHIGAN_NCAAF'),
  ('western_michigan_ncaab', 'Western Michigan Broncos', 'Kalamazoo', 'NCAAB', 'BASKETBALL', 'ncaaf/Western Michigan', 'WESTERN_MICHIGAN_NCAAB'),
  -- Wisconsin
  ('wisconsin_ncaaf', 'Wisconsin Badgers', 'Madison', 'NCAAF', 'FOOTBALL', 'ncaaf/Wisconsin', 'WISCONSIN_NCAAF'),
  ('wisconsin_ncaab', 'Wisconsin Badgers', 'Madison', 'NCAAB', 'BASKETBALL', 'ncaaf/Wisconsin', 'WISCONSIN_NCAAB'),
  -- Wyoming
  ('wyoming_ncaaf', 'Wyoming Cowboys', 'Laramie', 'NCAAF', 'FOOTBALL', 'ncaaf/Wyoming', 'WYOMING_NCAAF'),
  ('wyoming_ncaab', 'Wyoming Cowboys', 'Laramie', 'NCAAB', 'BASKETBALL', 'ncaaf/Wyoming', 'WYOMING_NCAAB')
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  city = EXCLUDED.city,
  logo_filename = EXCLUDED.logo_filename,
  sportsgameodds_id = EXCLUDED.sportsgameodds_id,
  updated_at = now();